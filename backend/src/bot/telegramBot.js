import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";
import client from "../utils/supabaseClient.js";
import { syncEmailsService } from "../services/emails.service.js";
import moment from "moment-timezone";
import dotenv from "dotenv";
dotenv.config();

if (!global.telegramBot) {
    global.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN,{ polling: true });
}
const bot = telegramBot;

///// HELPERS /////
function getCurrentWeekRange() {
  const now = moment().tz("America/Argentina/Buenos_Aires");

  /*const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);*/

  return {
    start: now.clone().startOf("isoWeek").toDate(),
    end: now.clone().endOf("isoWeek").toDate()
  };
}

function getNextWeekRange() {
  const now = moment().tz("America/Argentina/Buenos_Aires");

  /*const day = now.getDay();

  // días hasta el próximo lunes real
  const daysUntilNextMonday = day === 1
    ? 7
    : (8 - day);

  /*const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);

  nextMonday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextMonday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);*/

  const nextMonday = now.clone().startOf("isoWeek").add(1, "week");
  const nextSunday = nextMonday.clone().endOf("isoWeek");

  return {
    start: nextMonday,
    end: nextSunday
  };
}

function getCurrentAndNextWeekRange() {
  const current = getCurrentWeekRange();
  const next = getNextWeekRange();

  return {
    start: current.start,
    end: next.end
  };
}

async function getCurrentWeekEvents() {
  const { start, end } = getCurrentWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE due_date BETWEEN $1 AND $2
    ORDER BY due_date ASC
  `, [start, end]);

  return res.rows;
}

async function getCurrentWeekPendingEvents() {
  const { start, end } = getCurrentWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE paid = false
    AND due_date BETWEEN $1 AND $2
    ORDER BY due_date ASC
  `, [start, end]);

  return res.rows;
}

async function getNextWeekEvents() {
  const { start, end } = getNextWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE due_date BETWEEN $1 AND $2
    ORDER BY due_date ASC
  `, [start, end]);

  return res.rows;
}

function getEmoji(type) {
  const map = {
    "Personal": "📱",
    "Claro": "📱",
    "Fibertel": "📶",
    "Tarjeta Visa": "💳",
    "Tarjeta Mastercard": "💳",
    "Banco Santander": "🏛️",
    "Banco Galicia": "🏛️",
    "Luz": "💡",
    "Aysa": "💧",
    "Inglés": "📖",
    "Factura": "📄"
  };

  return map[type] || "📌";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(value);
}

//-------------------------------------------------------------------------//
///// CURRENT WEEK PAYMENTS /////
function formatCurrentWeekMessage(events) {
  if (!events.length) {
    return "✅ No tenés vencimientos esta semana.";
  }
  let total = 0;

  let msg = "📅 *Vencimientos de esta semana:*\n\n";

  for (const e of events) {
    const date = new Date(e.due_date).toLocaleDateString("es-AR", {
      weekday: "long"
    });

    const status = e.paid ? "✅ Pagado" : "⏳ Pendiente";

    msg += `${getEmoji(e.type)} *${e.type}*\n`;
    msg += `   ${capitalize(date)} | ${formatCurrency(e.amount)}\n`;
    msg += `   ${status}\n\n`;

    total += Number(e.amount);
  }

  msg += `💰 *Total semanal: ${formatCurrency(total)}*`;

  return msg;
}

///// CURRENT WEEK UNPAID EVENTS /////
function formatCurrentWeekPendingMessage(events) {
  if (!events.length) {
    return "✅ Ya pagaste todo lo de esta semana.";
  }
  let total = 0;

  let msg = "📅 *Pagos pendientes de esta semana:*\n\n";

  for (const e of events) {
    const date = new Date(e.due_date).toLocaleDateString("es-AR", {
      weekday: "long"
    });

    const status = e.paid ? "✅ Pagado" : "⏳ Pendiente";

    msg += `${getEmoji(e.type)} *${e.type}*\n`;
    msg += `   ${capitalize(date)} | ${formatCurrency(e.amount)}\n`;
    msg += `   ${status}\n\n`;

    total += Number(e.amount);
  }

  msg += `💰 *Total semanal: ${formatCurrency(total)}*`;

  return msg;
}

///// NEXT WEEK PAYMENTS /////
function formatNextWeekMessage(events) {
    if (!events.length) {
        return "✅ No tenés vencimientos la semana que viene.";
    }
    let total = 0;
    let msg = "📅 *Tus vencimientos de la semana que viene:*\n\n";

    for (const  e of events) {
        const date = new Date(e.due_date).toLocaleDateString("es-AR", {
            weekday: "long"
        });
        msg += `${getEmoji(e.type)} *${e.type}*\n`;
        msg += `   ${capitalize(date)} | ${formatCurrency(e.amount)}\n\n`
        total += Number(e.amount);
    }
    msg += `💰 *Total: ${formatCurrency(total)}*`;
    return msg;
}

//------------------------ BOT COMMANDS --------------------------------------//

bot.onText(/\/estaSemana/, async (msg) => {
  const chatId = msg.chat.id;

  const events = await getCurrentWeekEvents();

  const text = formatCurrentWeekMessage(events);

  bot.sendMessage(chatId, text, {parse_mode: "Markdown"});
});

bot.onText(/\/semanaSiguiente/, async (msg) => {
  const chatId = msg.chat.id;

  const events = await getNextWeekEvents();

  const text = formatNextWeekMessage(events);

  bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
});

bot.onText(/\/verPendientes/, async (msg) => {
  const chatId = msg.chat.id;

  const events = await getCurrentWeekPendingEvents();

  const text = formatCurrentWeekPendingMessage(events);

  bot.sendMessage(chatId, text, { parse_mode: "Markdown"});
});

bot.onText(/\/marcarPagado/, async (msg) => {
    const chatId = msg.chat.id;
    const { start, end } = getCurrentAndNextWeekRange();

    const events = await client.query(
        `SELECT id, type, due_date
        FROM events
        WHERE paid = false
        AND due_date BETWEEN $1 AND $2
        ORDER BY due_date ASC`,
        [start, end]);

    const keyboard = events.rows.map(e => [{
        text: e.type,
        callback_data: `pay_${e.id}`
    }]);

    bot.sendMessage(chatId, "Seleccioná el servicio que ya pagaste:", {
        reply_markup: {
            inline_keyboard: keyboard
        }
    }); 
});

bot.on("callback_query", async (query) => {
  const id = query.data.split("_")[1];

  await client.query(`
    UPDATE events SET paid = true WHERE id = $1
  `, [id]);

  bot.answerCallbackQuery(query.id, { text: "Marcado como pagado ✅" });
});

bot.onText(/\/sincronizarGmail/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        await syncEmailsService();
        bot.sendMessage(chatId, `
            ✅ Gmail sincronizado
            Escribe hola o envía /`);
    } catch (error) {
        console.log(error);
        bot.sendMessage(chatId, "❌ Error al sincronizar Gmail");
    }
});

bot.onText(/\/paginaWeb/, async (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Accedé a la página web en este link: https://alertavencimientos.vercel.app", { parse_mode: "Markdown"})
});

//------------------------ BOT MESSAGES --------------------------------------//
///// SEND WEEKLY MESSAGE /////
cron.schedule("0 9 * * 4", async () => {
  const users = await client.query(`SELECT chat_id FROM users`);

  const events = await getNextWeekEvents();
  const text = formatNextWeekMessage(events);

  for (const u of users.rows) {
    await bot.sendMessage(u.chat_id, text, { parse_mode: "Markdown" });
  }
}, {timezone: "America/Argentina/Buenos_Aires"});

///// WELCOME MESSAGE /////
bot.on("message", async (msg) => {
  const text = msg.text?.toLowerCase();
  const chatId = msg.chat.id;

  ///// IDENTIFY EACH USER CHAT /////
  await client.query(`
    INSERT INTO users (chat_id)
    VALUES ($1)
    ON CONFLICT (chat_id) DO NOTHING
  `, [chatId]);

  if (!text) return;

  if (["hola", "buenas", "holis", "holi", "bot", "facturas"].includes(text)) {
    bot.sendMessage(chatId, `
👋 Hola! Soy Boti 🤖, tu asistente de facturas.

📌 Utiliza los siguientes comandos para que te pueda ayudar:

🗓️/estaSemana → Ver vencimientos de esta semana

📆/semanaSiguiente → Ver vencimientos de la próxima semana  

🧷/verPendientes → Ver facturas pendientes de esta semana

✅/marcarPagado → Marcar una factura como pagada

💻/paginaWeb → Ir a la página web para tener más herramientas disponibles

📧/sincronizarGmail → Actualiza los vencimientos con los nuevos mails que te hayan llegado, te recomiendo clickearlo cada vez que entres a este chat para no perderte de ningún vencimiento!

Solo los tenés que escribir recordando usar "/", o escribiéndome "hola" te los vuelvo a enviar.

💡 Tip: Cada jueves te llega un mensaje con tus vencimientos de la semana que viene!
    `);
  }
});