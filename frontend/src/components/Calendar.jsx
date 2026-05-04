import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

function Calendar() {
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    const res = await fetch("http://localhost:3000/events");
    const data = await res.json();

    const formatted = data.map(e => ({
      id: e.id,
      title: e.type,
      start: e.due_date,
      backgroundColor: e.paid ? "#9c9c9c" : "#983ddf",
      extendedProps: {
        amount: e.amount,
        description: e.description,
        paid: e.paid,
      },
    }));

    setEvents(formatted);
  };

  useEffect(() => {
    const load = async () => {
      await fetchEvents();
    };
    load();
  }, []);

  return (
    <div style={{ width: "100%" }} className="card">
      <h1>Calendario</h1>
      <div style={{ width: "100%" }}>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            height="80vh"
            events={events}
            eventContent={(arg) => (
              <div className="event-box">
                <div><strong>{arg.event.title}</strong></div>
                <div>${arg.event.extendedProps.amount}</div>
                <div>{arg.event.extendedProps.description}</div>
              </div>
            )}
          />
      </div>
    </div>
  );
}

export default Calendar;