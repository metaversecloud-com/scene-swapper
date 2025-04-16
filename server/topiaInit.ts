import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

import { Topia, DroppedAssetFactory, SceneFactory, VisitorFactory, WorldFactory } from "@rtsdk/topia";

const config = {
  apiDomain: process.env.INSTANCE_DOMAIN || "api.topia.io",
  apiProtocol: process.env.INSTANCE_PROTOCOL || "https",
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

const myTopiaInstance = new Topia(config);

const DroppedAsset = new DroppedAssetFactory(myTopiaInstance);
const Scene = new SceneFactory(myTopiaInstance);
const Visitor = new VisitorFactory(myTopiaInstance);
const World = new WorldFactory(myTopiaInstance);

export { DroppedAsset, myTopiaInstance, Scene, Visitor, World };
