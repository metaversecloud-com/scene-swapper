import { errorHandler } from "./errorHandler";

export const initializeDroppedAssetDataObject = async (droppedAsset) => {
  try {
    await droppedAsset.fetchDataObject();

    if (!droppedAsset.dataObject?.position) {
      await droppedAsset.fetchDroppedAssetById();
      const { position } = droppedAsset;
      console.log("🚀 ~ file: initializeDroppedAssetDataObject.ts:10 ~ position:", position);

      const lockId = `${droppedAsset.id}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
      await droppedAsset.setDataObject(
        { position: { x: position.x + 100, y: position.y + 100 } },
        { lock: { lockId, releaseLock: true } },
      );
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeDroppedAssetDataObject",
      message: "Error initializing dropped asset data object",
    });
    return await droppedAsset.fetchDataObject();
  }
};
