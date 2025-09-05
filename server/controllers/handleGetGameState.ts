import { Request, Response } from "express";
import { DroppedAsset, Scene, Visitor } from "../topiaInit.js";
import { errorHandler, getCredentials } from "../utils/index.js";
import { VisitorInterface } from "@rtsdk/topia";
import { DataObjectType, SceneType } from "../types.js";

export const handleGetGameState = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, urlSlug, visitorId } = credentials;

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    if (!droppedAsset.dataObject || Object.keys(droppedAsset.dataObject).length === 0) {
      throw "Dropped asset data object not found.";
    }

    const {
      allowNonAdmins = false,
      currentSceneIndex,
      droppableSceneIds,
      lastSwappedDate,
      title,
      description,
    } = droppedAsset.dataObject as DataObjectType;

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const { isAdmin } = visitor;

    visitor.updatePublicKeyAnalytics([
      {
        analyticName: `${allowNonAdmins ? "allowNonAdmins" : "adminsOnly"}-${isAdmin ? "admin" : "nonAdmin"}-starts`,
        profileId,
        uniqueKey: profileId,
        urlSlug,
      },
    ]);

    const results = await Promise.allSettled(droppableSceneIds.map((sceneId) => Scene.get(sceneId, { credentials })));

    const scenes: SceneType[] = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => {
        const scene = result.value as unknown as SceneType;
        return {
          id: scene.id,
          active: scene.active,
          background: scene.background,
          created: scene.created,
          description: scene.description,
          height: scene.height,
          name: scene.name,
          previewImgUrl: scene.previewImgUrl,
          width: scene.width,
        };
      });

    return res.json({
      allowNonAdmins,
      isAdmin,
      lastSwappedDate,
      scenes,
      selectedSceneId: droppableSceneIds[currentSceneIndex],
      title,
      description,
      success: true,
    });
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
