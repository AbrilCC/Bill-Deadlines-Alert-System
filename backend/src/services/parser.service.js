import { createRequire } from "module";
import Tesseract from "tesseract.js";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");


//Para que el dinero pase de 10.000,99 a 10000.99 y se guarde bien en la DB
//Tambien incluye casos de 10,000,99 -> 10000.99
function normalizeAmount(str) {
  if (!str) return null;

  let cleaned = str.replace(/\s/g, "");

  // Caso raro: 154,201,00
  // Interpretarlo como 154201,00
  if ((cleaned.match(/,/g) || []).length === 2) {
    const lastComma = cleaned.lastIndexOf(",");
    
    cleaned =
      cleaned.slice(0, lastComma).replace(/,/g, "") +
      "." +
      cleaned.slice(lastComma + 1);
  } else {
    cleaned = cleaned
      .replace(/\./g, "") // elimina miles
      .replace(",", "."); // convierte decimal
  }
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : value;
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
  console.log("PDF TEXT:");
  console.log(text);

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

  //if (from.includes("fibertel")) return "Fibertel";
  //if (from.includes("personal")) return "Personal";
  //if (from.includes("claro")) return "Claro";
  //if (from.includes("visa")) return "Tarjeta Visa";
  //if (from.includes("mastercard")) return "Tarjeta Mastercard";
  //if (from.includes("santander")) return "Banco Santander";
  //if (from.includes("galicia")) return "Banco Galicia";
  //if (from.includes("inglés")) return "Inglés";  
  //if (from.includes("edenor")) return "Luz";
  //if (from.includes("aysa")) return "Aysa";

  if (/personal/.test(from)) return "Personal";
  if (/fibertel/.test(from)) return "Fibertel";
  if (/claro/.test(from)) return "Claro";
  if (/visa/.test(from)) return "Tarjeta Visa";
  if (/mastercard/.test(from)) return "Tarjeta Mastercard";
  if (/santander/.test(from)) return "Banco Santander";
  if (/galicia/.test(from)) return "Banco Galicia";
  if (/edenor/.test(from)) return "Luz";
  if (/aysa/.test(from)) return "Aysa";

  return "Factura";
}