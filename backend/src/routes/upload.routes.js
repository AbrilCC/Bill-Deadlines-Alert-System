    import express from "express";
    import multer from "multer";
    import { uploadManualInvoiceController } from "../controllers/upload.controller.js";
    import authMiddleware from "../middleware/auth.middleware.js";

    const router = express.Router();
    const upload = multer();

    router.post("/manual-invoice", authMiddleware, upload.single("invoice"), uploadManualInvoiceController);

    export default router;