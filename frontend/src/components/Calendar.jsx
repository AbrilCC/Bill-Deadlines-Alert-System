import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function Calendar() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    type: "",
    description: "",
    amount: "",
    due_date: "",
    preferred_days: []
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const dayMap = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
  };

  
  function parseLocalDate(dateStr) {
    const d = new Date(dateStr);

    return new Date(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate()
    );
  }

  const fetchEvents = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${BACKEND_API_URL}/events`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const data = await res.json();

    const formatted = data.map(e => {
      return {
        id: e.id,
        title: e.type,
        start: parseLocalDate(e.due_date),
        backgroundColor: e.paid ? "#9c9c9c" : "#df6b17",
        extendedProps: {
          amount: e.amount,
          description: e.description,
          paid: e.paid,
          email_id: e.email_id,
          preferred_days: e.preferred_days,
        },
      };
    });
    const suggestionEvents = [];
    for (const e of data) {
      if (e.paid) continue;
      if (new Date(e.due_date) < new Date()) continue;

      const dueDate = parseLocalDate(e.due_date);
      dueDate.setHours(0,0,0,0);
      const startWindow = new Date(dueDate);
      startWindow.setDate(startWindow.getDate() - 7);
      startWindow.setHours(0,0,0,0);

      //Look for preferred days 1 week before the due date
      for (const day of e.preferred_days || []) {
        const targetDay = dayMap[day];
        const current = new Date(startWindow);
        current.setHours(0,0,0,0);

        while (current < dueDate) {
          if (current.getDay() === targetDay) {
            suggestionEvents.push({
                id: `suggestion-${e.id}-${current.toISOString()}`,
                title: `💡 ${e.type}`,
                start: new Date(current),
                backgroundColor: "#7b61ff",
                extendedProps: {
                    isSuggestion: true,
                    originalEventId: e.id,
                    amount: e.amount,
                    description: e.description,
                    paid: e.paid,
                    preferred_days: e.preferred_days
                }
            });
          }
          current.setDate(current.getDate() + 1);
        }
      }
    }
    console.log(data);
    console.log(formatted);
    console.log("EVENTS TO CALENDAR:", [...formatted, ...suggestionEvents]);
    setEvents([...formatted, ...suggestionEvents]);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleTogglePaid = async () => {
    const isPaid = selectedEvent.extendedProps.paid;
    const realId =
    selectedEvent.extendedProps.isSuggestion
    ? selectedEvent.extendedProps.originalEventId
    : selectedEvent.id;

    const url = isPaid
      ? `${BACKEND_API_URL}/events/${realId}/unpay`
      : `${BACKEND_API_URL}/events/${realId}/pay`;

    await fetch(url, { method: "PATCH" });

    setShowModal(false);
    fetchEvents();
  };

  const handleEdit = async () => {
    await fetch(
      `${BACKEND_API_URL}/events/${selectedEvent.id}`,
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
    await fetch(`${BACKEND_API_URL}/events/${selectedEvent.id}`, {
      method: "DELETE",
    });

    setShowModal(false);
    fetchEvents();
  };

  const handleSyncEmails = async () => {
    try {
      setSyncLoading(true);
      await fetch(`${BACKEND_API_URL}/emails/sync`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      await fetchEvents();

    } catch (error) {
      console.error(error);
    } finally {
        setSyncLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const token = localStorage.getItem("token");
      window.location.href = `${BACKEND_API_URL}/auth/google?token=${token}`;

      await handleSyncEmails();

    } catch (error) {
      console.log(error);
    }
  };

  function toggleDay(day) {
    if (editForm.preferred_days.includes(day)) {
        setEditForm({
            ...editForm,
            preferred_days: editForm.preferred_days.filter(d => d !== day)
        });
    } else {
        setEditForm({
            ...editForm,
            preferred_days: [...editForm.preferred_days, day]
        });
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(value);
  };

  
  //Sync loading overlay for Sincronizar con Gmail
  if (syncLoading) {
    return (
      <div className="loadingOverlay">
        <div className="spinner"></div>
        <p>Sincronizando Gmail...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }} className="card">
      <h2>Calendario de pagos</h2>

      <button onClick={handleSyncEmails}>Sincronizar con Gmail</button>
      <button onClick={handleConnectGoogle}>Conectar mi Gmail</button>

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
                due_date: info.event.start,
                preferred_days: info.event.extendedProps.preferred_days || []
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

                  <label>Días en los que normalmente puedo pagar:</label>
                  <div className="daysSelector">
                      {[
                          "monday",
                          "tuesday",
                          "wednesday",
                          "thursday",
                          "friday",
                          "saturday",
                          "sunday"
                      ].map(day => (
                          <button key={day} type="button" className={
                                  editForm.preferred_days.includes(day)
                                  ? "selectedDay"
                                  : ""} onClick={() => toggleDay(day)}>
                              {day}
                          </button>
                      ))}
                  </div>
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
                href={`https://mail.google.com/mail/u/all/#inbox/${selectedEvent.extendedProps.email_id}`}
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