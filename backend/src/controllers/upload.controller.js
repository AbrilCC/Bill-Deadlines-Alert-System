import { formatDate } from "../services/emails.service.js";
import { parseInvoice, parseInvoiceFromText, extractTextFromImage } from "../services/parser.service.js";


export async function uploadManualInvoiceController(req, res) {
    
    try {
        let parsed = null;
        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;

        //Find pdfs:
        if (mimetype === "application/pdf") {        
            parsed = await parseInvoice(fileBuffer);

            //OCR fallback if no text was found, for image pdfs:
            if (parsed.amount == null && parsed.due_date == null) {
                const text = await extractTextFromImage(fileBuffer);
                parsed = parseInvoiceFromText(text);
            }
        }
        //Find images:
        if (!parsed && (mimetype === "image/png" || mimetype === "image/jpeg")) {
            const text = await extractTextFromImage(fileBuffer);
            parsed = parseInvoiceFromText(text);
        }
        return res.json(parsed);
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "Error parsing invoice"});
    }
};
