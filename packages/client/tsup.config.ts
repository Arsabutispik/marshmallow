import { createTsupConfig } from "../../tsup.config.js";
export default createTsupConfig({ external: ["ws", "undici"] });
