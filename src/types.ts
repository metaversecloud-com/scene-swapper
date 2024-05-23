import { DroppedAssetInterface } from "@rtsdk/topia";
export interface Credentials {
  assetId: string;
  displayName: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  username: string;
  urlSlug: string;
  visitorId: number;
}

export type DataObjectType = {
  currentSceneIndex: number;
  droppableSceneIds: string[];
  persistentDroppedAssets: string[];
  positionOffset: {
    x: number;
    y: number;
  };
};

export interface IDroppedAsset extends DroppedAssetInterface {
  dataObject: DataObjectType;
}
