import { syncEmailsService } from "../services/emails.service.js";

export const syncEmails = async (req, res) => {
  try {
    await syncEmailsService(req.user.id);

    res.json({
      success: true,
      message: "Sync complete"
    });
  } catch (err) {
    console.error("SYNC EMAILS ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};