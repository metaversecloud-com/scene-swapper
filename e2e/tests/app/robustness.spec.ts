// What the routes report when a Topia call fails part-way through a swap.
import { expect, test } from "../../fixtures";
import { sceneAssetIds, seedSwapper } from "./sceneWorld";

const SWALLOWED = "EXP-469: swapScene / removeScene swallow errors and the route answers success";

test("a swap whose scene drop fails isn't reported as done", async ({ request, world }) => {
  test.fail(true, SWALLOWED);
  await seedSwapper(world, { isAdmin: true, failures: { "/drop-scene": 500 } });

  const response = await request.post(world.api("/replace-scene"), { data: { selectedSceneId: "scene-city" } });

  // The old scene is already deleted at this point: the admin must at least be told.
  expect(response.ok()).toBe(false);
  expect((await response.json()).success).toBe(false);
});

test("a click whose scene drop fails isn't reported as done", async ({ request, world }) => {
  test.fail(true, SWALLOWED);
  await seedSwapper(world, { isAdmin: true, failures: { "/drop-scene": 500 } });

  const response = await request.post("/api/swap", { data: Object.fromEntries(world.credentials()) });

  expect(response.ok()).toBe(false);
});

test("a click on an asset that isn't set up as a scene swapper isn't reported as done", async ({ request, world }) => {
  test.fail(true, SWALLOWED);
  await world.seed({ isAdmin: true });

  const response = await request.post("/api/swap", { data: Object.fromEntries(world.credentials()) });

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
});

test("clearing a scene that Topia couldn't list isn't reported as done", async ({ request, world }) => {
  test.fail(true, SWALLOWED);
  await seedSwapper(world, { isAdmin: true, failures: { "/assets-with-scene-drop-id/": 500 } });

  const response = await request.post(world.api("/remove-scene"));

  expect(response.ok()).toBe(false);
  expect(await sceneAssetIds(world)).toEqual(["forest-bench", "forest-keeper", "forest-tree"]);
});

test("a swap without a sceneDropId doesn't drop a scene it can never clear", async ({ request, world }) => {
  test.fail(true, SWALLOWED);
  await seedSwapper(world, { isAdmin: true });

  const response = await request.post(world.api("/replace-scene", { sceneDropId: "" }), {
    data: { selectedSceneId: "scene-city" },
  });

  expect(response.ok()).toBe(false);
  expect(await world.events("drop-scene")).toHaveLength(0);
});
