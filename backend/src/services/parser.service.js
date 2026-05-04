import pdf from "pdf-parse";

export async function parseInvoice(buffer) {
  const data = await pdf(buffer);

  const text = data.text;

  // ⚠️ esto es heurístico (depende del PDF)
  const amountMatch = text.match(/\$\s?(\d+(?:\.\d{2})?)/);
  const dateMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);

  return {
    amount: amountMatch ? amountMatch[1] : null,
    due_date: dateMatch ? dateMatch[0] : null,
  };
}