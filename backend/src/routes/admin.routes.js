import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { getAdminData } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/admin/services", authMiddleware, getAdminData);

export default router;