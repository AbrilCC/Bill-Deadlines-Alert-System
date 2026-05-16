    import express from "express";
    import { getCurrentUser } from "../controllers/userInfo.controller.js";
    import authMiddleware from "../middleware/auth.middleware.js";

    const router = express.Router();

    router.get("/users/me", authMiddleware, getCurrentUser); 

    export default router;
