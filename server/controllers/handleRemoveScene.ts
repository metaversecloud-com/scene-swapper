import { Request, Response } from "express";
import { errorHandler, getCredentials, removeScene } from "../utils/index.js";
import { VisitorInterface } from "@rtsdk/topia";
import { DroppedAsset, Visitor } from "../topiaInit.js";
import { DataObjectType } from "../types.js";

export const handleRemoveScene = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, urlSlug, visitorId } = credentials;

    await removeScene(credentials);

    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
    const { allowNonAdmins } = droppedAsset.dataObject as DataObjectType;

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });
    const { isAdmin } = visitor;
    visitor.updatePublicKeyAnalytics([
      {
        analyticName: `${allowNonAdmins ? "allowNonAdmins" : "adminsOnly"}-${isAdmin ? "admin" : "nonAdmin"}-updates`,
        urlSlug,
      },
    ]);

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
