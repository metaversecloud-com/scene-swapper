import dotenv from "dotenv";
dotenv.config();

import { Topia, DroppedAssetFactory, WorldFactory } from "@rtsdk/topia";

const config = {
  apiDomain: process.env.INSTANCE_DOMAIN || "api.topia.io",
  apiKey: process.env.API_KEY,
  apiProtocol: process.env.INSTANCE_PROTOCOL || "https",
  interactiveKey: process.env.INTERACTIVE_KEY,
  interactiveSecret: process.env.INTERACTIVE_SECRET,
};

const myTopiaInstance = new Topia(config);

const DroppedAsset = new DroppedAssetFactory(myTopiaInstance);
const World = new WorldFactory(myTopiaInstance);

export { DroppedAsset, myTopiaInstance, World };
