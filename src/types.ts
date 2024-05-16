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
  persistentDroppedAssets: string[];
  positionOffset: {
    x: number;
    y: number;
  };
};
