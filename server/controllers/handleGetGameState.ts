import { Request, Response } from "express";
import { DroppedAsset, Scene, Visitor } from "../topiaInit.js";
import { errorHandler, getCredentials } from "../utils/index.js";
import { VisitorInterface } from "@rtsdk/topia";
import { DataObjectType, SceneType } from "../types.js";

export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const { isAdmin } = visitor;

    if (!isAdmin) return res.json({ isAdmin, success: true });

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const { currentSceneIndex, droppableSceneIds } = droppedAsset.dataObject as DataObjectType;

    let scenes: SceneType[] = [];

    for (const sceneId of droppableSceneIds) {
      const scene = await Scene.get(sceneId, { credentials });
      const sceneData = scene as unknown as SceneType;

      scenes.push({
        id: sceneId,
        active: sceneData.active,
        background: sceneData.background,
        created: sceneData.created,
        description: sceneData.description,
        height: sceneData.height,
        name: sceneData.name,
        previewImgUrl: sceneData.previewImgUrl,
        width: sceneData.width,
      });
    }

    return res.json({ isAdmin: true, scenes, selectedSceneId: droppableSceneIds[currentSceneIndex], success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetGameState",
      message: "Error getting visitor, dropped asset, or scenes.",
      req,
      res,
    });
  }
};
