import { DroppedAsset } from "../topiaInit";
import { Credentials } from "../types";
import { errorHandler } from "./errorHandler";
import { initializeDroppedAssetDataObject } from "./initializeDroppedAssetDataObject";

export const getDroppedAssetDataObject = async (credentials: Credentials) => {
  try {
    const { assetId, urlSlug } = credentials;
    const keyAsset = await DroppedAsset.create(assetId, urlSlug, {
      credentials: { ...credentials },
    });

    await initializeDroppedAssetDataObject(keyAsset);

    return { keyAsset };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getGameData",
      message: "Error getting game data.",
    });
  }
};
