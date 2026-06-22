import { google } from "googleapis";

function buildCalendarEvent(event) {
    const amount =
        event.amount != null
            ? `$${Number(event.amount).toLocaleString("es-AR")}`
            : "Monto pendiente";

    const dateOnly = new Date(event.due_date).toISOString().split("T")[0];
    const nextDay = new Date(event.due_date);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
        summary: `${event.type} - ${amount}`,
        description: `Monto: ${amount} ${event.description || ""}`.trim(),
        start: {date: dateOnly},
        end: {date: nextDay.toISOString().split("T")[0]}
    };
}

export async function createCalendarEvent(user, event) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
    });

    const calendar = google.calendar({ version: "v3", auth});
    const dateOnly = new Date(event.due_date).toISOString().split("T")[0];
    const nextDay = new Date(event.due_date);
    
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayOnly = nextDay.toISOString().split("T")[0];

    const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: buildCalendarEvent(event)
    });

    return res.data.id;
}

export async function updateCalendarEvent(user, googleEventId, event) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
    });

    const calendar = google.calendar({ version: "v3", auth});

    const res = await calendar.events.update({
        calendarId: "primary",
        eventId: googleEventId,
        requestBody: buildCalendarEvent(event)
    });

    return res.data.id;    
}

export async function deleteCalendarEvent(user, googleEventId) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    auth.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token
    });

    const calendar = google.calendar({ version: "v3", auth});

    const res = await calendar.events.delete({
        calendarId: "primary",
        eventId: googleEventId
    });

    console.log(`Google Calendar event ${googleEventId} deleted`);
}