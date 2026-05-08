import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";

function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: "",
    description: "",
    amount: "",
    due_date: ""
  })

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

  const handleEdit = async () => {
    await fetch(
      `http://localhost:3000/events/${selectedEvent.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editForm)
      }
    );
    setEditing(false);
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
            height="auto"
            contentHeight="auto"
            fixedWeekCount={false}
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
              setEditForm({
                type: info.event.title,
                description: info.event.extendedProps.description,
                amount: info.event.extendedProps.amount,
                due_date: info.event.start
              });
              setShowModal(true);
            }}
          />
      </div>

      {showModal && selectedEvent && (
        <div className="modalOverlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <button className="closeBtn" onClick={() => {setShowModal(false); setEditing(false)}}>X</button>

            {editing ? (
                <>
                  <input value={editForm.type} onChange={(e) => 
                    setEditForm({...editForm, type: e.target.value})}/>

                  <input value={editForm.description} onChange={(e) =>
                      setEditForm({...editForm, description: e.target.value})}/>

                  <input type="number" value={editForm.amount} onChange={(e) =>
                      setEditForm({...editForm, amount: e.target.value})}/>

                  <input type="date" value={
                      editForm.due_date ? new Date(editForm.due_date).toISOString().split("T")[0] : ""
                    } onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}/>
                </>
              ) : (
                <>
                  <h2>{selectedEvent.title}</h2>

                  <p>{selectedEvent.extendedProps.description}</p>
                  <p>Monto: {formatCurrency(selectedEvent.extendedProps.amount)}</p>

                  <p>Vencimiento: {new Date(selectedEvent.start).toLocaleDateString("es-AR")}</p>

                  <p>Estado del pago: {selectedEvent.extendedProps.paid ? "Pagado" : "Pendiente"}</p>
                </>
              )
            }

            <button onClick={() => setEditing(true)}>Editar</button>
            {editing && (<button onClick={handleEdit}>Guardar cambios</button>)}
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