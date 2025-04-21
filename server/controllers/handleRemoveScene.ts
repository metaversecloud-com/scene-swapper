import { Request, Response } from "express";
import { errorHandler, getCredentials, removeScene } from "../utils/index.js";

export const handleRemoveScene = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);

    await removeScene(credentials);

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveScene",
      message: "Error removing scene",
      req,
      res,
    });
  }
};
