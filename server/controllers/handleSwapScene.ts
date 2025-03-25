import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAsset, swapScene } from "../utils/index.js";

export const handleSwapScene = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.body);

    const droppedAsset = await getDroppedAsset(credentials);

    await swapScene(credentials, droppedAsset);

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
