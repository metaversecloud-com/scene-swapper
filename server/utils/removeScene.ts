import { DroppedAssetInterface, WorldInterface } from "@rtsdk/topia";
import { World } from "../topiaInit.js";
import { errorHandler } from "../utils/index.js";
import { Credentials } from "../types.js";

export const removeScene = async (credentials: Credentials, persistentDroppedAssets?: string[]) => {
  try {
    const { assetId, interactivePublicKey, sceneDropId, urlSlug } = credentials;

    if (!sceneDropId) throw "A sceneDropId is required to remove a scene.";

    const world: WorldInterface = World.create(urlSlug, { credentials });
    const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    const droppedAssetIds: string[] = [];

    for (const droppedAsset of droppedAssets) {
      if (droppedAsset.id && droppedAsset.id !== assetId) {
        if (
          !persistentDroppedAssets ||
          !droppedAsset.uniqueName ||
          (droppedAsset.uniqueName && !persistentDroppedAssets.includes(droppedAsset.uniqueName))
        ) {
          droppedAssetIds.push(droppedAsset.id);
        }
      }
    }

    if (droppedAssetIds.length > 0) {
      await World.deleteDroppedAssets(urlSlug, droppedAssetIds, process.env.INTERACTIVE_SECRET!, credentials);
    }
  } catch (error) {
    return errorHandler({
      error,
      functionName: "removeScene",
      message: "Error removing scene",
    });
  }
};
