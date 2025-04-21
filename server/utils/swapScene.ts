import { World } from "../topiaInit.js";
import { errorHandler, removeScene } from "../utils/index.js";
import { Credentials, DataObjectType } from "../types.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const swapScene = async (
  credentials: Credentials,
  droppedAsset: DroppedAssetInterface,
  selectedSceneId?: string,
) => {
  try {
    const { assetId, sceneDropId, urlSlug } = credentials;

    const {
      currentSceneIndex = 0,
      droppableSceneIds,
      persistentDroppedAssets = [],
      positionOffset = { x: 0, y: 0 },
    } = droppedAsset.dataObject as DataObjectType;

    const promises = [];

    const world = World.create(urlSlug, { credentials });

    await removeScene(credentials, persistentDroppedAssets);

    const newSceneIndex = selectedSceneId
      ? droppableSceneIds.indexOf(selectedSceneId)
      : droppableSceneIds.length > currentSceneIndex + 1
        ? currentSceneIndex + 1
        : 0;

    promises.push(
      world.dropScene({
        allowNonAdmins: true,
        position: { x: droppedAsset.position.x + positionOffset.x, y: droppedAsset.position.y + positionOffset.y },
        sceneDropId,
        sceneId: selectedSceneId || droppableSceneIds[newSceneIndex],
      }),
      droppedAsset.updateDataObject(
        { currentSceneIndex: newSceneIndex },
        {
          analytics: [{ analyticName: "sceneSwappedCount" }],
          lock: {
            lockId: `${assetId}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`,
            releaseLock: true,
          },
        },
      ),
    );

    await Promise.all(promises);
  } catch (error) {
    return errorHandler({
      error,
      functionName: "swapScene",
      message: "Error swapping scene",
    });
  }
};
