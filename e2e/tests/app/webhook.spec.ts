// POST /api/swap: the key asset's click webhook. Topia posts the clicking player's credentials in the body
// and the app moves on to the next scene in droppableSceneIds.
import { expect, test } from "../../fixtures";
import { sceneAssetIds, seedSwapper } from "./sceneWorld";

const click = (request: import("@playwright/test").APIRequestContext, world: import("../../fixtures").TopiaWorld, overrides: Record<string, string> = {}) =>
  request.post("/api/swap", { data: Object.fromEntries(world.credentials(overrides)) });

test("clicking the asset drops the next scene", async ({ request, world }) => {
  await seedSwapper(world, { isAdmin: true });

  const response = await click(request, world);

  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ success: true });
  const drops = await world.events("drop-scene");
  expect(drops).toHaveLength(1);
  expect(drops[0]).toMatchObject({ sceneId: "scene-beach", sceneDropId: "scene-1", position: { x: 510, y: 480 } });
  expect((await world.assetData()).currentSceneIndex).toBe(1);
  expect(await sceneAssetIds(world)).toEqual([drops[0].assetId, "forest-keeper"].sort());
});

test("clicking on the last scene starts over with the first", async ({ request, world }) => {
  await seedSwapper(world, { isAdmin: true, assetData: { currentSceneIndex: 2 } });

  await click(request, world);

  expect((await world.events("drop-scene"))[0]).toMatchObject({ sceneId: "scene-forest" });
  expect((await world.assetData()).currentSceneIndex).toBe(0);
});

test("without persistent assets configured, every asset of the old scene goes", async ({ request, world }) => {
  await seedSwapper(world, { isAdmin: true, assetData: { persistentDroppedAssets: undefined } });

  await click(request, world);

  const [drop] = await world.events("drop-scene");
  expect(await sceneAssetIds(world)).toEqual([drop.assetId]);
  expect((await world.state()).assets["other-drop"]).toBeTruthy();
});

test("counts the swap in analytics", async ({ request, world }) => {
  await seedSwapper(world, { isAdmin: true });

  await click(request, world);

  const names = (await world.events("analytics")).map((a) => a.analyticName);
  expect(names).toEqual(expect.arrayContaining(["adminsOnly-admin-updates", "sceneSwappedCount"]));
});

test("a player's click swaps the scene once admins allow everyone", async ({ request, world }) => {
  await seedSwapper(world, { isAdmin: false, assetData: { allowNonAdmins: true } });

  const response = await click(request, world);

  expect(response.ok()).toBe(true);
  expect(await world.events("drop-scene")).toHaveLength(1);
  expect((await world.events("analytics")).map((a) => a.analyticName)).toContain("allowNonAdmins-nonAdmin-updates");
});

test("a player's click doesn't swap the scene while swapping is for admins", async ({ request, world }) => {
  test.fail(true, "EXP-469: the server never checks isAdmin / allowNonAdmins");
  await seedSwapper(world, { isAdmin: false });

  const response = await click(request, world);

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
  expect(await sceneAssetIds(world)).toEqual(["forest-bench", "forest-keeper", "forest-tree"]);
});

test("two quick clicks drop one scene, not two on top of each other", async ({ request, world }) => {
  test.fail(true, "EXP-469: concurrent swaps each drop a scene; the lock doesn't guard the drop");
  // Both clicks read the asset before either swap lands, like a double click against the real API.
  await seedSwapper(world, { isAdmin: true, latencyMs: 30, delays: { "/drop-scene": 200 } });

  await Promise.all([click(request, world), click(request, world)]);

  expect(await world.events("drop-scene")).toHaveLength(1);
  expect(await sceneAssetIds(world)).toHaveLength(2); // the new scene + the persistent asset
});
