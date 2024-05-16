import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset } from "../utils/index.js";
import { DataObjectType } from "../types.js";
import { DroppedAssetInterface } from "@rtsdk/topia";
import { World } from "../topiaInit.js";

export const handleSwapScene = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);
    const { assetId, interactivePublicKey, sceneDropId, urlSlug } = credentials;

    const droppedAsset = await getDroppedAsset(credentials);
    const { currentSceneIndex, persistentDroppedAssets, positionOffset } = droppedAsset.dataObject as DataObjectType;

    const droppedAssetIds = [],
      promises = [];

    const droppableSceneIds = process.env["DROPPABLE_SCENE_IDS"] ? process.env["DROPPABLE_SCENE_IDS"]!.split(",") : [];

    const newSceneIndex = droppableSceneIds.length > currentSceneIndex + 1 ? currentSceneIndex + 1 : 0;

    const world = World.create(urlSlug, { credentials });
    const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });

    for (const droppedAsset of droppedAssets) {
      if (droppedAsset.id !== assetId) {
        if (!persistentDroppedAssets || !persistentDroppedAssets.includes(droppedAsset.uniqueName)) {
          droppedAssetIds.push(droppedAsset.id);
        }
      }
    }

    if (droppedAssetIds.length > 0) {
      promises.push(
        World.deleteDroppedAssets(urlSlug, droppedAssetIds, {
          interactivePublicKey,
          interactiveSecret: process.env.INTERACTIVE_SECRET,
        }),
      );
    }

    await droppedAsset.updateDataObject(
      { currentSceneIndex: newSceneIndex },
      {
        lock: { lockId: `${assetId}-${new Date(Math.round(new Date().getTime() / 10000) * 10000)}`, releaseLock: true },
      },
    );

    promises.push(
      world.dropScene({
        position: { x: droppedAsset.position.x + positionOffset.x, y: droppedAsset.position.y + positionOffset.y },
        sceneDropId,
        sceneId: droppableSceneIds[newSceneIndex],
      }),
    );

    await Promise.allSettled(promises);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleSwapScene",
      message: "Error swapping scene",
      req,
      res,
    });
  }
};
