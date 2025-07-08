"use strict";
import { Router } from "express";
import * as BC from "./branch.controler.js";
import { auth } from "../../middleware/auth.js";
import { dataValidation, globalMulter } from "../../service/multer.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post(
  "/",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  BC.createbranch,
);
router.put(
  "/:id",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  BC.updateBranch,
);
router.delete(
  "/:id",
  globalMulter(dataValidation.image).single("image"),
  auth(systemroles.admin),
  BC.deleteBranch,
);
router.get("/", BC.getbranches);
router.get("/:id", BC.getbranch);

export default router;
