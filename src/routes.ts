import express from "express";
import { getVersion } from "./utils/getVersion.js";
import { handleSwapScene } from "./controllers/index.js";

const router = express.Router();

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      APP_URL: process.env.APP_URL ? process.env.APP_URL : "NOT SET",
      COMMIT_HASH: process.env.COMMIT_HASH ? process.env.COMMIT_HASH : "NOT SET",
    },
  });
});

router.post("/swap", handleSwapScene);

export default router;
