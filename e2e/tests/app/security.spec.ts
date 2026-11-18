// The drawer's routes only check that the session is genuine; who may swap is decided by the page alone.
import { expect, test } from "../../fixtures";
import { minutesAgo, sceneAssetIds, seedSwapper } from "./sceneWorld";

const ADMIN_ONLY = "EXP-469: the server never checks isAdmin / allowNonAdmins";
const ORIGINAL_SCENE = ["forest-bench", "forest-keeper", "forest-tree"];

test("a player can't swap the scene while swapping is for admins", async ({ request, world }) => {
  test.fail(true, ADMIN_ONLY);
  await seedSwapper(world, { isAdmin: false });

  const response = await request.post(world.api("/replace-scene"), { data: { selectedSceneId: "scene-city" } });

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
  expect(await sceneAssetIds(world)).toEqual(ORIGINAL_SCENE);
});

test("a player can't clear the scene", async ({ request, world }) => {
  test.fail(true, ADMIN_ONLY);
  // Clearing is admin-only in the page even when everyone may swap.
  await seedSwapper(world, { isAdmin: false, assetData: { allowNonAdmins: true } });

  const response = await request.post(world.api("/remove-scene"));

  expect(response.ok()).toBe(false);
  expect(await sceneAssetIds(world)).toEqual(ORIGINAL_SCENE);
});

test("a player can't open swapping to everyone", async ({ request, world }) => {
  test.fail(true, ADMIN_ONLY);
  await seedSwapper(world, { isAdmin: false });

  const response = await request.post(world.api("/allow-non-admins"), { data: { allowNonAdmins: true } });

  expect(response.ok()).toBe(false);
  expect((await world.assetData()).allowNonAdmins).toBe(false);
});

test("a player can't skip the 30-minute wait by calling the API", async ({ request, world }) => {
  test.fail(true, "EXP-469: the 30-minute wait is only enforced in the page");
  await seedSwapper(world, { isAdmin: false, assetData: { allowNonAdmins: true, lastSwappedDate: minutesAgo(5) } });

  const response = await request.post(world.api("/replace-scene"), { data: { selectedSceneId: "scene-city" } });

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
});

test("only the asset's own scenes can be dropped", async ({ request, world }) => {
  test.fail(true, "EXP-469: replace-scene drops any sceneId it's sent");
  await seedSwapper(world, { isAdmin: false, assetData: { allowNonAdmins: true } });

  const response = await request.post(world.api("/replace-scene"), { data: { selectedSceneId: "someone-elses-scene" } });

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
  expect((await world.assetData()).currentSceneIndex).toBe(0);
  expect(await sceneAssetIds(world)).toEqual(ORIGINAL_SCENE);
});

test("an admin's swap to the asset's own scene is accepted from the API", async ({ request, world }) => {
  // Control for the tests above: the same call from an admin does swap.
  await seedSwapper(world, { isAdmin: true });

  const response = await request.post(world.api("/replace-scene"), { data: { selectedSceneId: "scene-city" } });

  expect(response.ok()).toBe(true);
  expect((await world.events("drop-scene"))[0]).toMatchObject({ sceneId: "scene-city" });
  expect((await world.assetData()).currentSceneIndex).toBe(2);
});

test("the webhook refuses a body without session credentials", async ({ request, world }) => {
  test.fail(true, "EXP-469: /swap answers success when it did nothing");
  await seedSwapper(world, { isAdmin: true });

  const response = await request.post("/api/swap", { data: {} });

  expect(response.ok()).toBe(false);
  expect((await response.json()).success).toBe(false);
});
