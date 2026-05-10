    import express from "express";
    import { uploadManualInvoiceController } from "../controllers/upload.controller.js";
    import authMiddleware from "../middleware/auth.middleware.js";

    const router = express.Router();

    router.post("/manual-invoice", authMiddleware, upload.single("invoice"), uploadManualInvoiceController);

    export default router;