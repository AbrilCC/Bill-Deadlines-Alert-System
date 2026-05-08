import { syncEmailsService } from "../services/emails.service.js";

export const syncEmails = async (req, res) => {
  try {
    await syncEmailsService();

    res.json({
      success: true,
      message: "Sync complete"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};