import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, swapScene } from "../utils/index.js";

export const handleReplaceScene = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { selectedSceneId } = req.body;

    const droppedAsset = await getDroppedAsset(credentials);

    await swapScene(credentials, droppedAsset, selectedSceneId);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleReplaceScene",
      message: "Error replacing scene",
      req,
      res,
    });
  }
};
