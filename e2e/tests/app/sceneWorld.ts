// A scene swapper key asset with three droppable scenes, the current scene's assets in the world and the
// scenes' details in the mock.
import { SCENE_DROP_ID, type SeedOptions, type TopiaWorld } from "../../fixtures";

export const SCENES = {
  "scene-forest": { name: "Forest", description: "Tall trees", previewImgUrl: "https://example.invalid/forest.png" },
  "scene-beach": { name: "Beach", description: "Sand and waves", previewImgUrl: "https://example.invalid/beach.png" },
  "scene-city": { name: "City", description: "Busy streets", previewImgUrl: "https://example.invalid/city.png" },
};
export const SCENE_IDS = Object.keys(SCENES);

/** The key asset's data object as the app's setup leaves it, showing the first scene. */
export const swapperData = (overrides: Record<string, unknown> = {}) => ({
  allowNonAdmins: false,
  currentSceneIndex: 0,
  droppableSceneIds: SCENE_IDS,
  persistentDroppedAssets: ["keep-me"],
  positionOffset: { x: 10, y: -20 },
  title: "Pick a backdrop",
  description: "Choose the scene around this sign.",
  ...overrides,
});

/** Assets the current scene drop placed (plus one it shouldn't touch), by id. */
export const SCENE_ASSETS = {
  "forest-tree": { id: "forest-tree", sceneDropId: SCENE_DROP_ID, position: { x: 100, y: 100 } },
  "forest-bench": { id: "forest-bench", sceneDropId: SCENE_DROP_ID, uniqueName: "bench", position: { x: 200, y: 100 } },
  "forest-keeper": { id: "forest-keeper", sceneDropId: SCENE_DROP_ID, uniqueName: "keep-me", position: { x: 300, y: 100 } },
  "other-drop": { id: "other-drop", sceneDropId: "another-drop", position: { x: 900, y: 900 } },
};

export const seedSwapper = (
  world: TopiaWorld,
  { assetData = {}, ...options }: Omit<SeedOptions, "assetData"> & { assetData?: Record<string, unknown> } = {},
) =>
  world.seed({
    assetData: swapperData(assetData),
    scenes: SCENES,
    extraAssets: SCENE_ASSETS,
    ...options,
  });

/** Ids of the assets in the world tagged with the key asset's sceneDropId, except the key asset itself. */
export const sceneAssetIds = async (world: TopiaWorld) =>
  Object.values((await world.state()).assets)
    .filter((a) => a.sceneDropId === SCENE_DROP_ID && a.id !== world.assetId)
    .map((a) => a.id as string)
    .sort();

/** A minute count ago, as the ISO string the data object stores. */
export const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
