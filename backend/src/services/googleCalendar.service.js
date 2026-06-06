import { google } from "googleapis";

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
        requestBody: {
            summary: event.type,
            description: event.description,
            start: {date: dateOnly},
            end: {date: nextDayOnly}
        }
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
        requestBody: {
            summary: event.type,
            description: event.description,
            start: {date: event.due_date},
            end: {date: event.due_date}
        }
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
}