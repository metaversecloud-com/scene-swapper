<div align="center">
<img src="https://global-uploads.webflow.com/62e7004a0f9b3a63b980ac3c/62e70c84dd3aac06fb2ac2b6_topia-logo-blue-2x.png" style="width: 120px; margin-bottom: 20px" alt="Topia logo">
</div>

# Scene Swapper

## Introduction

Scene Swapper is a lightweight on-canvas app that turns a single dropped asset into a scene picker for a Topia world. Clicking the key asset either cycles to the next scene in its configured list (via a webhook), or opens a drawer where the visitor picks a specific scene from a card grid and hits "Update Scene". Under the hood, every swap wipes the current scene's sibling assets, then drops the newly-picked scene at the same `sceneDropId` so the key asset stays in place and re-anchors the new layout.

Admins can also toggle whether non-admins are allowed to swap, wipe the current scene without dropping a replacement, and mark specific `uniqueName`s as "persistent" so they survive a swap.

## Key Features

### Canvas elements & interactions

- **Key asset:** identified by the `assetId` on the click payload — no unique-name lookup. Clicking it fires the `/api/swap` webhook, which cycles to the next scene in `droppableSceneIds`. If the visitor instead opens the drawer, they can pick any scene from the list and call `/api/replace-scene` to jump directly to it.
- **Drawer content:** a title, an optional description, a card grid of every scene in `droppableSceneIds` (rendered from each scene's `previewImgUrl` and `name`), an admin-only "Allow all users to swap scenes?" checkbox, an "Update Scene" button, and an admin-only "Clear Current Scene" danger button.
- **Non-admin cooldown:** the client blocks non-admin swaps for 30 minutes after `lastSwappedDate`. Admins swap without cooldown. The cooldown is enforced only on the client — the server does not reject early swaps.
- **Non-admin gate:** when `allowNonAdmins` is `false` (default) and the visitor is not an admin, the drawer shows a placeholder screen (`🔮` emoji + a random fact from `getFact.ts`) instead of the picker.

### Admin features

- Toggle `allowNonAdmins` on/off via the drawer checkbox.
- "Clear Current Scene" wipes every sibling in the current scene drop without dropping a replacement — useful for resetting a broken scene.
- Admins never see the cooldown message.

## Required Assets with Unique Names

Scene Swapper does **not** require any specific unique name on the key asset — the click payload's `assetId` identifies the target. There are no `{app}_container` or `SceneSwapper_keyAsset` lookups anywhere in the codebase.

| Unique Name       | Required | Description                                                                                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| _(none required)_ | —        | The key asset is identified by `credentials.assetId` from the click. `uniqueName` is passed through as a query param but never consumed by the server. |

> `persistentDroppedAssets` on the key asset's data object holds an array of **uniqueNames** that `removeScene` should skip during a swap or clear — populate it if you drop assets into the scene that must survive a swap (e.g. an ambient prop or a second interactive).

## Technical Architecture

### Data Objects

#### Key Asset (`DataObjectType`)

The only persistent surface this app writes. Defined in [`server/types.ts`](server/types.ts). The data object must be seeded before first click — `getDroppedAsset` throws if `droppableSceneIds` is missing.

```ts
{
  allowNonAdmins: boolean;              // Non-admins can swap when true. Default false.
  currentSceneIndex: number;            // Index into droppableSceneIds for the currently-shown scene.
  droppableSceneIds: string[];          // Ordered scene catalogue. Cycled by the /swap webhook.
  lastSwappedDate: Date;                // Written after each /replace-scene call. Powers the 30-min client cooldown.
  persistentDroppedAssets: string[];    // uniqueNames removeScene must NOT delete during a swap.
  positionOffset: { x: number; y: number }; // Added to key asset's position when calling world.dropScene.
  title: string;                        // Drawer h2 (falls back to "Scene Swapper" on the client).
  description: string;                  // Drawer body text.
}
```

#### Visitor / World

Not used. Nothing about scene state is stored per-visitor or on the world — the key asset's data object is the whole persistence surface.

### Swap Flow

Both `/api/replace-scene` (drawer pick) and `/api/swap` (webhook cycle) run the same [`swapScene`](server/utils/swapScene.ts):

1. Read `droppableSceneIds`, `currentSceneIndex`, `persistentDroppedAssets`, `positionOffset` off the key asset data object.
2. Fire the `-updates` analytic on the visitor's public key (see below).
3. Call [`removeScene`](server/utils/removeScene.ts) → `world.fetchDroppedAssetsBySceneDropId({ sceneDropId })` and delete every returned asset that isn't the key asset and whose `uniqueName` isn't in `persistentDroppedAssets`.
4. Pick the next scene:
   - If `selectedSceneId` was passed (drawer path), use it.
   - Otherwise (webhook path), advance `currentSceneIndex + 1`, wrapping to `0`.
5. `world.dropScene({ sceneDropId, sceneId, position: keyAsset.position + positionOffset, allowNonAdmins: true })` at the same `sceneDropId` — the key asset itself is preserved.
6. Update the data object with the new `currentSceneIndex` and fire the `sceneSwappedCount` analytic (with a 10-second time-bucketed `lockId` to dedupe concurrent clicks).
7. `/api/replace-scene` additionally writes `lastSwappedDate: new Date()` for the client cooldown.

> Unlike Breakout, Scene Swapper does **not** delete the key asset at the end of the swap. The key asset stays put and the new scene reuses its `sceneDropId`, so no setup webhook re-fires.

## API Endpoints

All routes mount under `/api`. Credentials (`interactiveNonce`, `interactivePublicKey`, `urlSlug`, `visitorId`) are validated by [`getCredentials`](server/utils/getCredentials.ts); the `interactivePublicKey` must match `process.env.INTERACTIVE_KEY`.

| Method | Route                   | Reads From  | Auth | Description                                                                                                                                                                                                                   |
| ------ | ----------------------- | ----------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/`                 | —           | —    | Sanity check.                                                                                                                                                                                                                 |
| `GET`  | `/api/system/health`    | —           | —    | Version + env-var status (`NODE_ENV`, `INSTANCE_DOMAIN`, `INTERACTIVE_KEY`, `INTERACTIVE_SECRET`, `APP_URL`, `COMMIT_HASH`).                                                                                                  |
| `GET`  | `/api/game-state`       | `req.query` | —    | Returns `{ allowNonAdmins, isAdmin, lastSwappedDate, scenes, selectedSceneId, title, description }`. `scenes` is resolved by `Promise.allSettled(droppableSceneIds.map(Scene.get))` — invalid scene ids are silently dropped. |
| `POST` | `/api/replace-scene`    | `req.query` | —    | Body: `{ selectedSceneId }`. Runs the swap flow, writes `lastSwappedDate`.                                                                                                                                                    |
| `POST` | `/api/remove-scene`     | `req.query` | —    | Wipes the current scene drop's siblings without dropping a replacement. UI only exposes this to admins.                                                                                                                       |
| `POST` | `/api/allow-non-admins` | `req.query` | —    | Body: `{ allowNonAdmins }`. Writes the flag to the data object. UI only exposes this to admins.                                                                                                                               |
| `POST` | `/api/swap`             | `req.body`  | —    | Webhook: cycles to the next `droppableSceneIds` entry. Wired to the key asset's click webhook in Topia.                                                                                                                       |

> **Admin gating is client-side only.** `/api/remove-scene` and `/api/allow-non-admins` do not check `isAdmin` on the server — a caller with valid credentials can hit them regardless. Consider this when exposing the app to untrusted worlds.

## Analytics

All analytics are fired via `visitor.updatePublicKeyAnalytics` or the `analytics` option on `updateDataObject`. Names dynamically encode who fired them via a `${gate}-${role}-${verb}` pattern, where `gate` is `allowNonAdmins` or `adminsOnly` and `role` is `admin` or `nonAdmin`.

| Event                   | Fired from                                                                         | Frequency                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<gate>-<role>-starts`  | `handleGetGameState` (drawer open)                                                 | Once per drawer open, per visitor (deduped by `uniqueKey: profileId`).                       |
| `<gate>-<role>-updates` | `swapScene` (fires from both `/replace-scene` and `/swap`) and `handleRemoveScene` | Once per swap or clear, per visitor.                                                         |
| `sceneSwappedCount`     | `swapScene`'s `updateDataObject` call                                              | Once per completed swap. `lockId` buckets by 10-second window to dedupe rapid double-clicks. |

Example expanded event names: `adminsOnly-admin-starts`, `allowNonAdmins-nonAdmin-updates`.

## Environment Variables

Env is loaded from `../.env` (the app root). Only `INTERACTIVE_KEY` and `INTERACTIVE_SECRET` are checked at boot — everything else is optional or has a default.

| Variable             | Description                                                                                                | Required |
| -------------------- | ---------------------------------------------------------------------------------------------------------- | -------- |
| `INTERACTIVE_KEY`    | Topia interactive app public key. Enforced against the incoming `interactivePublicKey` on every request.   | Yes      |
| `INTERACTIVE_SECRET` | Topia interactive app secret. Passed to `World.deleteDroppedAssets`.                                       | Yes      |
| `INSTANCE_DOMAIN`    | Topia API domain (`api.topia.io` prod, `api-stage.topia.io` staging). Defaults to `api.topia.io`.          | No       |
| `INSTANCE_PROTOCOL`  | `https` (default) or `http` for local.                                                                     | No       |
| `NODE_ENV`           | `development` enables permissive CORS (`localhost:3000`, `localhost:5173`). Non-dev serves `client/build`. | No       |
| `PORT`               | Express port. Defaults to `3000`.                                                                          | No       |
| `APP_URL`            | Surfaced in `/system/health` for deploy tracking. Not consumed by the swap flow.                           | No       |
| `COMMIT_HASH`        | Surfaced in `/system/health` for deploy tracking.                                                          | No       |

> There is no `SCENE_IDS` env var and no `SCENE_ID_*` presets. The scene catalogue lives on the key asset's `droppableSceneIds` data-object field and must be seeded before first click.

### Where to find `INTERACTIVE_KEY` and `INTERACTIVE_SECRET`

- [Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)
- [Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

## Getting Started

```bash
# from the app root
npm install

# create a .env at the root — see .env-example
cp .env-example .env

# run client + server together (client on Vite, server on nodemon)
npm run dev
```

## For Developers

### Built With

#### Client

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### App-specific notes

- **Seed the data object before first click.** [`getDroppedAsset`](server/utils/getDroppedAsset.ts) throws `"No data object found for this key asset."` if `droppableSceneIds` is missing. Populate the key asset's data object out-of-band (e.g. from a setup script or Topia's data-object editor) with at minimum `droppableSceneIds`, `currentSceneIndex: 0`, and optionally `title`, `description`, `positionOffset`, `persistentDroppedAssets`, `allowNonAdmins`.
- **`/api/swap` is the webhook target,** not `/webhook/swap`. Point the key asset's click webhook at `/api/swap` — the handler reads credentials from `req.body` while all drawer endpoints read from `req.query`.
- **The key asset survives every swap.** `removeScene` skips `droppedAsset.id === credentials.assetId`, and `dropScene` reuses the same `sceneDropId` — a swap replaces the _contents_ of the scene drop, not the key asset itself.
- **Scenes are resolved with `Promise.allSettled`.** A bad scene id in `droppableSceneIds` won't crash `/game-state`; it's silently skipped and the card grid renders whatever resolved.
- **Cooldown is client-only.** The 30-minute non-admin cooldown lives in [`Home.tsx`](client/src/pages/Home.tsx) — the server accepts a swap at any cadence.
- **Concurrent-click dedupe.** `updateDataObject` inside `swapScene` uses a `lockId` that buckets to 10-second windows, so two clicks in the same window can't both bump `currentSceneIndex`.
- **`cleanReturnPayload` middleware** strips `topia`, `credentials`, `jwt`, and `requestOptions` from every JSON response.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
- View it in action: [Dev](https://topia.io/scene-swapper-dev), [Prod](https://topia.io/scene-swapper-prod)
- [Notion One Pager](https://app.notion.com/p/topiaio/Scene-Swapper-41aa34557f9c4a0980f350909008179e?v=71f6c3828d3b4f33960326f9bde24781)
