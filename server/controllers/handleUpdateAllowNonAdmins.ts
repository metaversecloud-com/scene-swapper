import { Request, Response } from "express";
import { DroppedAsset } from "../topiaInit.js";
import { errorHandler, getCredentials } from "../utils/index.js";

export const handleUpdateAllowNonAdmins = async (req: Request, res: Response) => {
  try {
    const { allowNonAdmins } = req.body;
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug } = credentials;

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    if (!droppedAsset.dataObject || Object.keys(droppedAsset.dataObject).length === 0)
      throw "Dropped asset data object not found.";

    await droppedAsset.updateDataObject({ allowNonAdmins });

    return res.json({
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateAllowNonAdmins",
      message: "Error updating dropped asset data object.",
      req,
      res,
    });
  }
};
