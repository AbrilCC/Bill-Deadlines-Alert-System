import { createRequire } from "module";
import Tesseract from "tesseract.js";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");


//Para que el dinero pase de 10.000,99 a 10000.99 y se guarde bien en la DB
//Tambien incluye casos de 10,000,99 -> 10000.99
function normalizeAmount(str) {
  if (!str) return null;
  let cleaned = str.replace(/\s/g, "").replace(/\$/g, "");
  cleaned = cleaned.replace(/[^\d.,-]/g, "");
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  const commas = (cleaned.match(/,/g) || []).length;

  //Format 10.000,00
  if (hasComma && hasDot && cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  //Format 10,000.00
  else if (hasComma && hasDot && cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
    cleaned = cleaned.replace(/,/g, "");
  }

  //Format 10,000,00
  else if (commas >= 2) {
    const lastComma = cleaned.lastIndexOf(",");
    cleaned =
      cleaned.slice(0, lastComma).replace(/,/g, "") +
      "." +
      cleaned.slice(lastComma + 1);
  }

  //Format 10000,00
  else if (commas === 1) {
    cleaned = cleaned.replace(",", ".");
  }

  //Format 10.000.00
  else if (!hasComma && (cleaned.match(/\./g) || []).length >= 2) {
    const lastDot = cleaned.lastIndexOf(".");
    cleaned =
      cleaned.slice(0, lastDot).replace(/\./g, "") +
      "." +
      cleaned.slice(lastDot + 1);
  }
  
  //Format 10000.00 is already alright
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
}

export function looksLikeInvoice(text) {
  const lower = text.toLowerCase();
  const invoiceKeywords = [
    "vencimiento",
    "fecha de vencimiento",
    "factura",
    "importe",
    "total a pagar",
    "saldo",
    "abonar"
  ];

  const hasKeyword = invoiceKeywords.some(word =>
    lower.includes(word)
  );

  const hasDate = /\d{2}\/\d{2}\/\d{4}/.test(text);

  const hasMoney = /\$\s?[\d.,]+/.test(text);

  return hasKeyword && (hasDate || hasMoney);
}


export async function parseInvoice(buffer) {
  let data;
  try {
    data = await pdf(buffer);
  } catch (error) {
    console.log("PDF PARSE ERROR:", error.message);

    return {
      amount: null,
      due_date: null,
    };
  }
  const text = data.text || "";
  const lowerText = text.toLowerCase();

  // ===== BUSCAR PARES FECHA + IMPORTE =====
  const paymentMatches = [
    ...text.matchAll(
      /(vencimiento|vence|hasta)[^\d]*(\d{2}\/\d{2}\/\d{4}).*?\$\s?([\d.,]+)/gis
    )
  ];
  if (paymentMatches.length > 0) {
    const first = paymentMatches[0];

    return {
      due_date: first[2],
      amount: normalizeAmount(first[3]),
    };
  }

  // ===== MONTO =====
  const amountMatches = [
    ...text.matchAll(
      /(total|importe|saldo|monto|pagar)[^$\d]{0,30}\$\s?([\d.,]+)/gi
    )
  ];
  const amountKeywords = ["total", "importe total", "monto total"];

  let amountIndex = -1;

  for (const word of amountKeywords) {
    const i = lowerText.indexOf(word);
    if (i !== -1) {
      amountIndex = i;
      break;
    }
  }

  let chosenAmount = null;

  if (amountIndex !== -1 && amountMatches.length > 0) {
    let closest = null;
    let minDistance = Infinity;

    for (const match of amountMatches) {
      const distance = Math.abs(match.index - amountIndex);
      if (distance < minDistance) {
        minDistance = distance;
        closest = match[2];
      }
    }

    chosenAmount = normalizeAmount(closest);
  }

  // ===== FECHA =====
  const dateMatches = [...text.matchAll(/\d{2}\/\d{2}\/\d{4}/g)];

  const dateKeywords = ["vencimiento", "fecha de vencimiento"];

  let dateIndex = -1;

  for (const word of dateKeywords) {
    const i = lowerText.indexOf(word);
    if (i !== -1) {
      dateIndex = i;
      break;
    }
  }

  let chosenDate = null;

  if (dateIndex !== -1 && dateMatches.length > 0) {
    let closest = null;
    let minDistance = Infinity;

    for (const match of dateMatches) {
      const distance = Math.abs(match.index - dateIndex);
      if (distance < minDistance) {
        minDistance = distance;
        closest = match[0];
      }
    }

    chosenDate = closest;
  }

  return {
    amount: chosenAmount,
    due_date: chosenDate,
  };
};

/* For mails without a pdf */
export function parseInvoiceFromText(text) {
  const lowerText = text.toLowerCase();

  const amountMatches = [...text.matchAll(/\$\s?([\d.,]+)/g)];
  const dateMatches = [...text.matchAll(/\d{2}\/\d{2}\/\d{4}/g)];

  const amountKeywords = ["total", "pagar", "saldo", "importe"];
  const dateKeywords = ["vence", "vencimiento", "fecha límite"];

  // ===== MONTO =====
  let amountIndex = -1;

  for (const word of amountKeywords) {
    const i = lowerText.indexOf(word);
    if (i !== -1) {
      amountIndex = i;
      break;
    }
  }

  let chosenAmount = null;

  if (amountIndex !== -1) {
    let minDistance = Infinity;

    for (const match of amountMatches) {
      const distance = Math.abs(match.index - amountIndex);
      if (distance < minDistance) {
        minDistance = distance;
        chosenAmount = normalizeAmount(match[1]);;
      }
    }
  }

  // ===== FECHA =====
  let dateIndex = -1;

  for (const word of dateKeywords) {
    const i = lowerText.indexOf(word);
    if (i !== -1) {
      dateIndex = i;
      break;
    }
  }

  let chosenDate = null;

  if (dateIndex !== -1) {
    let minDistance = Infinity;

    for (const match of dateMatches) {
      const distance = Math.abs(match.index - dateIndex);
      if (distance < minDistance) {
        minDistance = distance;
        chosenDate = match[0];
      }
    }
  }

  return {amount: chosenAmount, due_date: chosenDate};
}

//For mails with an image pdf:
export async function extractTextFromImage(buffer) {
  const result = await Tesseract.recognize(buffer, "spa");
  return result.data.text;
}

//Detect the type of the event (hardcoded)
export function detectType(subject, sender, body) {
  const text = (subject + " " + body).toLowerCase();
  const from = sender.toLowerCase();

  if (/fibertel/.test(from)) return "Fibertel";
  if (/visa/.test(from)) return "Tarjeta Visa";
  if (/mastercard/.test(from)) return "Tarjeta Mastercard";
  if (/santander/.test(from)) return "Banco Santander";
  if (/galicia/.test(from)) return "Banco Galicia";
  if (/edenor/.test(from)) return "Edenor";
  if (/aysa/.test(from)) return "Aysa";
  if (/metrogas/.test(from)) return "Metrogas";
  if (/aranceles/.test(from)) return "Colegio";
  if (/claro/.test(from)) return "Claro";
  if (/personal/.test(from)) return "Personal";

  return "Factura";
}