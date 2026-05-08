const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export const getEvents = async () => {
    const res = await fetch(`${BACKEND_API_URL}/events`);
    return res.json();
};

export const createEvent = async (event) => {
    const res = await fetch(`${BACKEND_API_URL}/events`, {
        method: "POST",
        headers: {"Content-type": "application/json"},
        body: JSON.stringify(event),
    });
    return res.json();
};