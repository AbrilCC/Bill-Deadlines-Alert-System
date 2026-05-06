import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";

function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchEvents = async () => {
    const res = await fetch("http://localhost:3000/events");
    const data = await res.json();

    const formatted = data.map(e => ({
      id: e.id,
      title: e.type,
      start: e.due_date,
      backgroundColor: e.paid ? "#9c9c9c" : "#df6b17",
      extendedProps: {
        amount: e.amount,
        description: e.description,
        paid: e.paid,
        email_id: e.email_id,
      },
    }));

    setEvents(formatted);
  };

  useEffect(() => {
    fetchEvents();

    const lastSync = Number(localStorage.getItem("lastSync"));
    const now = Date.now();

    if (!lastSync || now - lastSync> 5 * 60 * 1000) { //5min de intervalo
      fetch("http://localhost:3000/emails/sync").then(() => {
        localStorage.setItem("lastSync", now);
        fetchEvents();
      })
      .catch(console.error);
    }
  }, []);

  const handleTogglePaid = async () => {
    const isPaid = selectedEvent.extendedProps.paid;

    const url = isPaid
      ? `http://localhost:3000/events/${selectedEvent.id}/unpay`
      : `http://localhost:3000/events/${selectedEvent.id}/pay`;

    await fetch(url, { method: "PATCH" });

    setShowModal(false);
    fetchEvents();
  };

  const handleDelete = async () => {
    await fetch(`http://localhost:3000/events/${selectedEvent.id}`, {
      method: "DELETE",
    });

    setShowModal(false);
    fetchEvents();
  };
  
  const handleSyncEmails = async () => {
    await fetch("http://localhost:3000/emails/sync");
    await fetchEvents(); // 🔥 recarga eventos
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  return (
    <div style={{ width: "100%" }} className="card">
      <h2>Calendario de pagos</h2>

      <button onClick={handleSyncEmails}>Sincronizar con Gmail</button>

      <div style={{ width: "100%" }}>
          <FullCalendar
            plugins={[dayGridPlugin]}
            locale={esLocale}
            initialView="dayGridMonth"
            height="80vh"
            events={events}
            eventContent={(arg) => (
              <div className="event-box" style={{
                backgroundColor: arg.event.backgroundColor,
                color: arg.event.extendedProps.paid ? "#f0f0f0" : "white"}}>
                <div style={{"fontSize": "18px"}}><strong>{arg.event.title}</strong></div>
                <div>{arg.event.extendedProps.description}</div>
                <div>{formatCurrency(arg.event.extendedProps.amount)}</div>
              </div>
            )}
            eventClick={(info) => {
              setSelectedEvent(info.event);
              setShowModal(true);
            }}
          />
      </div>

      {showModal && selectedEvent && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <button className="closeBtn" onClick={() => setShowModal(false)}>X</button>

            <h2>{selectedEvent.title}</h2>
            <p>{selectedEvent.extendedProps.description}</p>
            <p>Monto: {formatCurrency(selectedEvent.extendedProps.amount)}</p>
            <p>Vencimiento: {new Date(selectedEvent.start).toLocaleDateString("es-AR")}</p>
            <p>Estado del pago: {selectedEvent.extendedProps.paid ? "Pagado" : "Pendiente"}</p>

            <button onClick={handleTogglePaid}>{selectedEvent.extendedProps.paid
              ? "Marcar como NO pagado"
              : "Marcar como pagado"}</button>
            <button onClick={handleDelete}>Eliminar notificación</button>
            {selectedEvent.extendedProps.email_id && (
              <a
                href={`https://mail.google.com/mail/u/0/#inbox/${selectedEvent.extendedProps.email_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >Ver mail</a>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;