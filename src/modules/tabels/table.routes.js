 "use strict";
import { Router } from "express";
import * as TC from "./tabels.controler.js";
import { auth } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post("/", auth(systemroles.admin), TC.createTable);
router.get("/", auth(systemroles.admin), TC.getTables);
router.put("/:id", auth(systemroles.admin), TC.updateTable);
router.delete("/:id", auth(systemroles.admin), TC.deleteTable);

export default router;
