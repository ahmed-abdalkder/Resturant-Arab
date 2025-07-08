 "use strict";
import { Router } from "express";
import * as UC from "./user.controler.js";
import { auth, authOptional } from "../../middleware/auth.js";
import { systemroles } from "../../utils/systemroles.js";

const router = Router();

router.post("/admin", authOptional(systemroles.superadmin), UC.signupadmin);
router.get("/confirm/:token", UC.confirm);
router.post("/login", UC.signinadmin);
router.put("/admin", UC.forgetpassword);
router.put("/admin/rest", UC.resetPassword);
router.get("/", auth([systemroles.admin, systemroles.superadmin]), UC.getUsers);
router.put("/:id", auth([systemroles.superadmin]), UC.updateUser);
router.delete("/:id", auth([systemroles.superadmin]), UC.deleteUser);

export default router;
