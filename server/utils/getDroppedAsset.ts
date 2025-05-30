import { DroppedAsset } from "../topiaInit.js";
import { Credentials, DataObjectType } from "../types.js";
import { errorHandler } from "./errorHandler.js";

export const getDroppedAsset = async (credentials: Credentials) => {
  try {
    const { assetId, urlSlug } = credentials;
    const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    const dataObject = droppedAsset.dataObject as DataObjectType;
    if (!dataObject.droppableSceneIds) throw "No data object found for this key asset.";

    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getGameData",
      message: "Error getting game data.",
    });
  }
};
