import { expect, test } from "../../fixtures";
import { minutesAgo, sceneAssetIds, seedSwapper } from "./sceneWorld";

const card = (page: import("@playwright/test").Page, name: string) =>
  page.locator(".card").filter({ has: page.getByRole("heading", { name }) });

test("an admin sees the title, every scene and the current one selected", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Pick a backdrop" })).toBeVisible();
  await expect(page.getByText("Choose the scene around this sign.")).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(3);
  await expect(card(page, "Forest")).toHaveClass(/success/);
  await expect(card(page, "Beach")).not.toHaveClass(/success/);
  await expect(card(page, "City").getByText("Busy streets")).toBeVisible();
  await expect(page.getByRole("img", { name: "Beach" })).toHaveAttribute("src", "https://example.invalid/beach.png");
  await expect(page.getByRole("checkbox", { name: "Allow all users to swap scenes?" })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Clear Current Scene" })).toBeVisible();
});

test("marks the scene the asset currently shows", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true, assetData: { currentSceneIndex: 1 } });
  await page.goto(world.url("/"));

  await expect(card(page, "Beach")).toHaveClass(/success/);
  await expect(card(page, "Forest")).not.toHaveClass(/success/);
});

test("falls back to the default title when the asset has none", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true, assetData: { title: "", description: "" } });
  await page.goto(world.url("/"));

  await expect(page.getByRole("heading", { name: "Scene Swapper" })).toBeVisible();
});

test("a player sees only a fortune while swapping is for admins", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: false });
  await page.goto(world.url("/"));

  await expect(page.getByText("🔮")).toBeVisible();
  await expect(page.locator(".card")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Update Scene" })).toHaveCount(0);
});

test("a player can pick a scene once admins allow everyone, without the admin controls", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: false, assetData: { allowNonAdmins: true } });
  await page.goto(world.url("/"));

  await expect(page.locator(".card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeEnabled();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Clear Current Scene" })).toHaveCount(0);
});

test("an admin swaps to the picked scene, keeping persistent assets", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));

  await card(page, "City").click();
  await expect(card(page, "City")).toHaveClass(/success/);
  await page.getByRole("button", { name: "Update Scene" }).click();

  await expect.poll(async () => (await world.assetData()).currentSceneIndex).toBe(2);
  const drops = await world.events("drop-scene");
  expect(drops).toHaveLength(1);
  // Dropped where the key asset is (500, 500) plus the positionOffset, under the key asset's sceneDropId.
  expect(drops[0]).toMatchObject({ sceneId: "scene-city", sceneDropId: "scene-1", position: { x: 510, y: 480 } });
  // The old scene's assets are gone except the persistent one; the key asset and other drops stay.
  expect(await sceneAssetIds(world)).toEqual([drops[0].assetId, "forest-keeper"].sort());
  const { assets } = await world.state();
  expect(assets[world.assetId]).toBeTruthy();
  expect(assets["other-drop"]).toBeTruthy();
  expect(Date.parse((await world.assetData()).lastSwappedDate)).toBeGreaterThan(Date.now() - 60_000);
  await expect(page.locator(".text-error")).toHaveCount(0);
});

test("records who opened the app and each swap in analytics", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));
  await card(page, "Beach").click();
  await page.getByRole("button", { name: "Update Scene" }).click();
  await expect.poll(async () => (await world.assetData()).currentSceneIndex).toBe(1);

  const names = (await world.events("analytics")).map((a) => a.analyticName);
  expect(names).toContain("adminsOnly-admin-starts");
  expect(names).toContain("adminsOnly-admin-updates");
  expect(names).toContain("sceneSwappedCount");
});

test("an admin lets everyone swap scenes", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));

  await page.getByRole("checkbox", { name: "Allow all users to swap scenes?" }).check();

  await expect.poll(async () => (await world.assetData()).allowNonAdmins).toBe(true);
  await page.getByRole("checkbox", { name: "Allow all users to swap scenes?" }).uncheck();
  await expect.poll(async () => (await world.assetData()).allowNonAdmins).toBe(false);
});

test("an admin clears the current scene after confirming", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));

  await page.getByRole("button", { name: "Clear Current Scene" }).click();
  await expect(page.getByText("Are you sure?")).toBeVisible();
  await page.getByRole("button", { name: "Yes" }).click();

  await expect(page.getByText("Are you sure?")).toBeHidden();
  await expect.poll(() => sceneAssetIds(world)).toEqual([]);
  const { assets } = await world.state();
  expect(assets[world.assetId]).toBeTruthy();
  expect(assets["other-drop"]).toBeTruthy();
  expect(await world.events("drop-scene")).toHaveLength(0);
});

test("saying no keeps the current scene", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true });
  await page.goto(world.url("/"));

  await page.getByRole("button", { name: "Clear Current Scene" }).click();
  await page.getByRole("button", { name: "No" }).click();

  await expect(page.getByText("Are you sure?")).toBeHidden();
  expect(await sceneAssetIds(world)).toEqual(["forest-bench", "forest-keeper", "forest-tree"]);
  expect(await world.events("delete-asset")).toHaveLength(0);
});

test("a player has to wait 30 minutes after the last swap", async ({ page, world }) => {
  await seedSwapper(world, { assetData: { allowNonAdmins: true, lastSwappedDate: minutesAgo(5) } });
  await page.goto(world.url("/"));

  await expect(page.locator(".card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeDisabled();
  await expect(page.locator("p.text-danger")).toHaveText(
    "Hang tight! Scenes can only be updated every 30 minutes. Please try again soon.",
  );
});

test("a player can swap again once 30 minutes have passed", async ({ page, world }) => {
  await seedSwapper(world, { assetData: { allowNonAdmins: true, lastSwappedDate: minutesAgo(31) } });
  await page.goto(world.url("/"));

  await expect(page.locator(".card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeEnabled();
  await expect(page.locator("p.text-danger")).toHaveCount(0);
});

test("a player's swap starts the 30-minute wait", async ({ page, world }) => {
  await seedSwapper(world, { assetData: { allowNonAdmins: true } });
  await page.goto(world.url("/"));

  await card(page, "Beach").click();
  await page.getByRole("button", { name: "Update Scene" }).click();

  await expect(page.getByRole("button", { name: "Update Scene" })).toBeDisabled();
  await expect(page.locator("p.text-danger")).toContainText("every 30 minutes");
  expect((await world.events("drop-scene"))[0]).toMatchObject({ sceneId: "scene-beach" });
});

test("an admin isn't held to the 30-minute wait", async ({ page, world }) => {
  // Home's load handler checks the wait with isAdmin from before the response arrived (still false).
  test.fail(true, "EXP-469: admins get the players' 30-minute wait on load");
  await seedSwapper(world, { isAdmin: true, assetData: { lastSwappedDate: minutesAgo(5) } });
  await page.goto(world.url("/"));

  await expect(page.locator(".card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeEnabled();
});

test("shows an error when the asset isn't set up as a scene swapper", async ({ page, world }) => {
  await world.seed({ isAdmin: true });
  await page.goto(world.url("/"));

  await expect(page.locator(".text-error")).toContainText("Error");
  await expect(page.locator(".card")).toHaveCount(0);
});

test("shows an error when Topia fails to load the asset", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true, failures: { [`GET /api/v1/world/${world.urlSlug}/assets/`]: 500 } });
  await page.goto(world.url("/"));

  await expect(page.locator(".text-error")).toContainText("Error");
});

test("shows an error when the swap fails", async ({ page, world }) => {
  await seedSwapper(world, { isAdmin: true, failures: { "/update-data-object": 500 } });
  await page.goto(world.url("/"));

  await card(page, "Beach").click();
  await page.getByRole("button", { name: "Update Scene" }).click();

  await expect(page.locator(".text-error")).toContainText("Error");
  await expect(page.getByRole("button", { name: "Update Scene" })).toBeEnabled();
});
