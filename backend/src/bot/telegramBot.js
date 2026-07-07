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
  /*return {
    start: now.clone().startOf("isoWeek").toDate(),
    end: now.clone().endOf("isoWeek").toDate()
  };*/
  return {
    start: now.clone().startOf("isoWeek").format("YYYY-MM-DD"),
    end: now.clone().endOf("isoWeek").format("YYYY-MM-DD")
  };
}

function getNextWeekRange() {
    const now = moment().tz("America/Argentina/Buenos_Aires");
  return {
    start: now.clone().startOf("isoWeek").add(1, "week").format("YYYY-MM-DD"),
    end: now.clone().endOf("isoWeek").add(1, "week").format("YYYY-MM-DD")
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

async function getCurrentWeekEvents(user_id) {
  const { start, end } = getCurrentWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE due_date BETWEEN $1 AND $2
    AND user_id = $3
    ORDER BY due_date ASC
  `, [start, end, user_id]);

  return res.rows;
}

async function getCurrentWeekPendingEvents(user_id) {
  const { start, end } = getCurrentWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE paid = false
    AND due_date BETWEEN $1 AND $2
    AND user_id = $3
    ORDER BY due_date ASC
  `, [start, end, user_id]);

  return res.rows;
}

async function getNextWeekEvents(user_id) {
  const { start, end } = getNextWeekRange();

  const res = await client.query(`
    SELECT * FROM events
    WHERE due_date BETWEEN $1 AND $2
    AND user_id = $3
    ORDER BY due_date ASC
  `, [start, end, user_id]);

  return res.rows;
}

async function getTodayEvents(user_id) {
  const today = moment()
    .tz("America/Argentina/Buenos_Aires")
    .format("YYYY-MM-DD");

  const res = await client.query(`
    SELECT *
    FROM events
    WHERE user_id = $1
    AND paid = false
    AND due_date = $2
    ORDER BY due_date ASC
  `, [user_id, today]);

  return res.rows;
}

async function getTodayReminders(user_id) {
  const today = moment()
    .tz("America/Argentina/Buenos_Aires")
    .format("YYYY-MM-DD");

  const res = await client.query(`
    SELECT *
    FROM reminders
    WHERE user_id = $1
    AND reminder_date = $2
    ORDER BY reminder_time ASC
  `, [user_id, today]);

  return res.rows;
}

async function getCurrentWeekReminders(user_id) {
  const { start, end } = getCurrentWeekRange();

  const res = await client.query(`
    SELECT *
    FROM reminders
    WHERE user_id = $1
    AND reminder_date BETWEEN $2 AND $3
    ORDER BY reminder_date, reminder_time
  `,[user_id, start, end]);

  return res.rows;
}

async function getNextWeekReminders(user_id){
  const {start, end}=getNextWeekRange();

  const res=await client.query(`
    SELECT *
    FROM reminders
    WHERE user_id = $1
    AND reminder_date BETWEEN $2 AND $3
    ORDER BY reminder_date, reminder_time
  `,[user_id, start, end]);

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
    "Edenor": "💡",
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
function formatCurrentWeekMessage(events, reminders) {
  let msg = "";
  if (events.length) {
      let total = 0;
      let msg = "📅 *Vencimientos de esta semana:*\n\n";

      for (const e of events) {
        const date = new Date(e.due_date).toLocaleDateString("es-AR", {
          weekday: "long"
        });
        msg += `${getEmoji(e.type)} *${e.type}*\n`;
        msg += `   ${capitalize(date)} | ${formatCurrency(e.amount)}\n`;
        msg += `   ${e.paid ? "✅ Pagado" : "⏳ Pendiente"}\n\n`;

        total += Number(e.amount);
      }
      msg += `💰 *Total semanal: ${formatCurrency(total)}*`;
  }

  if (reminders.length) {
    msg += "\n📝 *Recordatorios*\n\n";

    for (const r of reminders) {
      const date = moment(r.reminder_date).tz("America/Argentina/Buenos_Aires").format("dddd D");

      msg += `🔔 *${r.title}*\n`;
      msg += `${capitalize(date)}\n`;

      if(r.description) { msg += `${r.description}\n`; }
      msg += "\n";
    }
  }
  if (msg === "") {
      return "✅ No tenés vencimientos ni recordatorios esta semana.";
  }
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

///// TODAY'S EVENTS /////
function formatTodayEvents(events) {
  if (!events.length) return null;
  let total = 0;
  let msg = "⏰ *Hoy vencen estas facturas:*\n\n";
  for (const e of events) {
    msg += `${getEmoji(e.type)} *${e.type}*\n`;
    msg += `💰 ${formatCurrency(e.amount)}\n\n`;

    total += Number(e.amount);
  }
  return msg;
}

///// TODAY'S REMINDERS /////
function formatTodayReminders(reminders) {
  if (!reminders.length) return null;
  let msg = "📝 *Recordatorios de hoy:*\n\n";
  for (const r of reminders) {
    msg += `🔔 *${r.title}*\n`;
    if (r.description) {
      msg += `${r.description}\n`;
    }
    if (r.reminder_time) {
      msg += `🕘 ${r.reminder_time}\n`;
    }
    msg += `\n`;
  }
  return msg;
}

///// WEEKLY REMINDERS /////
function formatWeekReminders(reminders){
    if(!reminders.length){ return ""; }
    let msg="\n📝 *Recordatorios*\n\n";
    for(const r of reminders){
        const date = moment(r.reminder_date).locale("es").format("dddd D");
        msg+=`🔔 *${r.title}*\n`;
        msg+=`${capitalize(date)}\n`;
        if(r.description){
            msg+=`${r.description}\n`;
        }
        msg+="\n";
    }
    return msg;
}

//------------------------ BOT COMMANDS --------------------------------------//

bot.onText(/\/estaSemana/, async (msg) => {
  const chatId = msg.chat.id;
  const userRes = await client.query(
    `SELECT id FROM users WHERE chat_id = $1`,
    [chatId]);
  const user = userRes.rows[0];
  if (!user) {
    return bot.sendMessage(chatId, "Usuario no encontrado");
  }
  const events = await getCurrentWeekEvents(user.id);
  const reminders = await getCurrentWeekReminders(user.id);
  bot.sendMessage(chatId, formatCurrentWeekMessage(events, reminders), {parse_mode:"Markdown"});

  if (reminders.length) {
    bot.sendMessage(chatId, formatWeekReminders(reminders), {parse_mode:"Markdown"});
  }
});

bot.onText(/\/semanaSiguiente/, async (msg) => {
  const chatId = msg.chat.id;
  const userRes = await client.query(
    `SELECT id FROM users WHERE chat_id = $1`,
    [chatId]);
  const user = userRes.rows[0];
  if (!user) {
    return bot.sendMessage(chatId, "Usuario no encontrado");
  }
  const events = await getNextWeekEvents(user.id);
  bot.sendMessage(chatId, formatNextWeekMessage(events), {parse_mode:"Markdown"});

  const reminders = await getNextWeekReminders(user.id);
  if (reminders.length) {
    bot.sendMessage(chatId, formatWeekReminders(reminders), {parse_mode:"Markdown"});
  }
});

bot.onText(/\/verPendientes/, async (msg) => {
  const chatId = msg.chat.id;
  const userRes = await client.query(
    `SELECT id FROM users WHERE chat_id = $1`,
    [chatId]);
  const user = userRes.rows[0];
  if (!user) {
    return bot.sendMessage(chatId, "Usuario no encontrado");
  }
  const events = await getCurrentWeekPendingEvents(user.id);
  const reminders = await getCurrentWeekReminders(user.id);

  const text = formatCurrentWeekPendingMessage(events) + formatWeekReminders(reminders);

  bot.sendMessage(chatId, text, { parse_mode: "Markdown"});
});

bot.onText(/\/marcarPagado/, async (msg) => {
  const chatId = msg.chat.id;
  const userRes = await client.query(
    `SELECT id FROM users WHERE chat_id = $1`,
    [chatId]);
  const user = userRes.rows[0];
  if (!user) {
    return bot.sendMessage(chatId, "Usuario no encontrado");
  }
  const { start, end } = getCurrentAndNextWeekRange(user.id);

  const events = await client.query(
      `SELECT id, type, due_date
      FROM events
      WHERE user_id = $1 AND paid = false
      AND due_date BETWEEN $2 AND $3
      ORDER BY due_date ASC`,
      [user.id, start, end]);

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
  const chatId = query.message.chat.id;
  const userRes = await client.query(
    `SELECT id FROM users WHERE chat_id = $1`,
    [chatId]
  );
  const user = userRes.rows[0];

  await client.query(`
    UPDATE events SET paid = true WHERE id = $1 AND user_id = $2
  `, [id, user.id]);

  bot.answerCallbackQuery(query.id, { text: "Marcado como pagado ✅" });
});

bot.onText(/\/sincronizarGmail/, async (msg) => {
    const chatId = msg.chat.id;
    const userRes = await client.query(
        `SELECT id FROM users WHERE chat_id = $1`, [chatId]
    );
    const user = userRes.rows[0];
    if (!user) {
      return bot.sendMessage(chatId,
          `Necesitás primero vincular tu cuenta de Gmail desde la página web: https://alertavencimientos.vercel.app`
      )
    }
    try {
        await syncEmailsService(user.id);
        bot.sendMessage(chatId, `
            ✅ Gmail sincronizado
            Para ver si tienes nuevos vencimientos cargados, escribe hola o envía /verPendientes`);
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
///// START /////
bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1];
     try {
        // Buscar el token
        const tokenRes = await client.query(
          `SELECT user_id, expires_at
            FROM telegram_tokens
            WHERE token = $1`,
          [token]
        );
        if (!tokenRes.rowCount) {
          return bot.sendMessage(chatId,
              "❌ Este enlace ya expiró o no es válido. Intentá de nuevo.");
        }
        const row = tokenRes.rows[0];
        // Verificar expiración
        if (new Date(row.expires_at) < new Date()) {
          await client.query(
              `DELETE FROM telegram_tokens
                WHERE token = $1`,
              [token]);
          return bot.sendMessage(chatId,
              "⌛ Este enlace expiró. Volvé a abrir Telegram desde la página web.");
        }
        // Asociar el chat al usuario existente
        await client.query(
          `UPDATE users
            SET chat_id = $1
            WHERE id = $2`,
          [chatId, row.user_id]
        );
        // Eliminar el token para que no pueda reutilizarse
        await client.query(
          `DELETE FROM telegram_tokens
            WHERE token = $1`,
          [token]
        );
        bot.sendMessage(chatId,
            "✅ ¡Cuenta vinculada correctamente! Escribí Hola para comenzar.");

    } catch (err) {
        console.error(err);
        bot.sendMessage(chatId, "❌ Error al vincular la cuenta.");
    }
});

///// SEND WEEKLY MESSAGE /////
cron.schedule("0 9 * * 4", async () => {
  const users = await client.query(`SELECT id, chat_id FROM users WHERE chat_id IS NOT NULL`);
  
  for (const u of users.rows) {
    const events = await getNextWeekEvents(u.id);
    const reminders = await getNextWeekReminders(u.id);
    const text = formatNextWeekMessage(events) + formatWeekReminders(reminders);

    await bot.sendMessage(u.chat_id, text, { parse_mode: "Markdown" });
  }
}, {timezone: "America/Argentina/Buenos_Aires"});

///// SEND DAILY EVENTS /////
cron.schedule("0 9 * * *", async () => {
    const users = await client.query(`SELECT id, chat_id FROM users WHERE chat_id IS NOT NULL`);
    
    for (const u of users.rows) {
      const events = await getTodayEvents(u.id);
      if (!events.length) continue;
      const text = formatTodayEvents(events);
      await bot.sendMessage(u.chat_id, text, { parse_mode: "Markdown" });
    }
  }, {timezone: "America/Argentina/Buenos_Aires"});

///// SEND DAILY REMINDERS /////
cron.schedule("0 9 * * *", async () => {
  const users = await client.query(`
    SELECT id, chat_id
    FROM users
    WHERE chat_id IS NOT NULL
  `);

  for (const u of users.rows) {
    const reminders = await getTodayReminders(u.id);
    if (!reminders.length) continue;
    const text = formatTodayReminders(reminders);
    await bot.sendMessage(
      u.chat_id,
      text,
      { parse_mode: "Markdown" }
    );
  }
}, {timezone: "America/Argentina/Buenos_Aires"});

///// WELCOME MESSAGE /////
bot.on("message", async (msg) => {
  const text = msg.text?.toLowerCase();
  const chatId = msg.chat.id;

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