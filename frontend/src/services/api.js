const API_URL = "http://localhost:3000";

export const getEvents = async () => {
    const res = await fetch(`${API_URL}/events`);
    return res.json();
};

export const createEvent = async (event) => {
    const res = await fetch(`${API_URL}/events`, {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify(event),
    });
    return res.json();
};