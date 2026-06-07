import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { TriangleAlert } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function Calendar({gmailConnected, userData}) {
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderForm, setReminderForm] = useState({
      title: "",
      description: "",
      time: ""
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({
    x: 0,
    y: 0
  });
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
    console.log("LOG DE DATA: ", data);

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
          payment_method: e.payment_method,
          preferred_days: e.preferred_days,
        },
      };
    });
    const suggestionEvents = [];
    for (const e of data) {
      if (e.paid) continue;
      const today = new Date();
      today.setHours(0,0,0,0);
      const due = new Date(e.due_date);
      due.setHours(0,0,0,0);
      if (due < today) continue;

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
    const reminders = await fetchReminders();
    setEvents([...formatted, ...suggestionEvents, ...reminders]);
  };

  const fetchReminders = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BACKEND_API_URL}/reminders`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    const data = await res.json();

    return data.map(r => ({
      id: `reminder-${r.id}`,
      title: `📝 ${r.title}`,
      start: parseLocalDate(r.reminder_date),
      backgroundColor: "#2e6e89",
      extendedProps: {
        isReminder: true,
        reminderId: r.id,
        description: r.description,
        reminder_time: r.reminder_time
      }
    }));
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
    const token = localStorage.getItem("token");

    await fetch(url, { 
      method: "PATCH",
      headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
    });

    fetchEvents();
    setShowModal(false);
  };

  const handleEdit = async () => {
    const token = localStorage.getItem("token");
    const realId =
      selectedEvent.extendedProps.isSuggestion
      ? selectedEvent.extendedProps.originalEventId
      : selectedEvent.id;

    const payload = {...editForm};
    if (payload.amount && payload.description === "Falta el monto") {
      payload.description = "";
    }
    await fetch(
      `${BACKEND_API_URL}/events/${realId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
           Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );
    await fetchEvents();
    setEditing(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    //If it's a suggestion, delete it only from the frontend
    if (selectedEvent.extendedProps?.isSuggestion) {
      setEvents(prev => prev.filter(e => e.id != selectedEvent.id));
      setShowModal(false);
      return;
    }
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_API_URL}/events/${selectedEvent.id}`,
    {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
    });

    setShowModal(false);
    fetchEvents();
  };

  const handleDeleteReminder = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${BACKEND_API_URL}/reminders/${selectedEvent.extendedProps.reminderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setShowModal(false);
      fetchEvents();
    } catch (error) {
      console.error(error);
    }
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

  async function createReminder() {
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_API_URL}/reminders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: reminderForm.title,
          description: reminderForm.description,
          reminder_date: selectedDate,
          reminder_time:
            reminderForm.time || "09:00"
        })
      }
    );
    setShowReminderModal(false);
    setReminderForm({
      title: "",
      description: "",
      time: ""
    });
    fetchEvents();
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

      <div className="tooltipWrapper">
        <button onClick={handleSyncEmails} disabled={!gmailConnected}
        title={!gmailConnected ? "Debes conectar tu cuenta de gmail primero para poder sincronizar tus mails" : ""}
        style={{opacity: !gmailConnected ? 0.5 : 1, cursor: !gmailConnected ? "not-allowed" : "pointer"}}>
          Sincronizar con Gmail
        </button>

        {gmailConnected && (
          <span className="tooltipText">
            Sincronizar con la cuenta:
            <br />
            {userData?.gmail_account}
          </span>
        )}
      </div>

      

      <div className="tooltipWrapper">
        <button onClick={handleConnectGoogle} disabled={gmailConnected}
        style={{"opacity": gmailConnected ? 0.5 : 1, "cursor": gmailConnected ? "not-allowed" : "pointer"}}>
          Conectar mi Gmail</button>

          {gmailConnected && (
            <span className="tooltipText">
              Tu Gmail ya está conectado
            </span>
          )}
      </div>

      <div style={{ width: "100%" }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
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
                {!arg.event.extendedProps.isReminder && (
                  <div>
                    {arg.event.extendedProps.amount == null
                      ? <span><TriangleAlert size={17}/>Clickeá Ver mail para encontrar el monto</span>
                      : formatCurrency(arg.event.extendedProps.amount)
                    }
                  </div>
                )}
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
            dateClick={(info) => {
              const rect = info.dayEl.getBoundingClientRect();
              setSelectedDate(info.dateStr);
              setPopupPosition({
                x: rect.left + 10,
                y: rect.top + 10
              });
              setShowReminderPopup(true);
            }}
          />
      </div>

      {showModal && selectedEvent && (
        <div className="modalOverlay" onClick={() => {setShowModal(false); setEditing(false)}}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <button className="closeBtn" onClick={() => {setShowModal(false); setEditing(false)}}>X</button>

            {editing && editForm.amount == null && (
              <div className="warningBox">
                <TriangleAlert size={18} /><span>No pudimos detectar el monto automáticamente.
                  Hacé clic en "Ver mail" y completá el campo Monto.</span>
              </div>
            )}
            {editing ? (
                <>
                  <input value={editForm.type} onChange={(e) => 
                    setEditForm({...editForm, type: e.target.value})}/>

                  <input value={editForm.description} onChange={(e) =>
                      setEditForm({...editForm, description: e.target.value})}/>

                  <input type="number" value={editForm.amount ?? ""} 
                  className={!editForm.amount ? "missingAmountInput" : ""}
                  placeholder="Ingresá el monto encontrado en el mail"
                  onChange={(e) =>
                      setEditForm({...editForm, amount: e.target.value})}/>

                  <input type="date" value={
                      editForm.due_date ? new Date(editForm.due_date).toISOString().split("T")[0] : ""
                    } onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}/>

                  <p>Método de pago: {selectedEvent.extendedProps.payment_method || "No definido"}</p>

                  <label>Días en los que normalmente puedo pagar:</label>
                  <div className="daysSelector">
                      {[
                          { label: "Lunes", value: "monday" },
                          { label: "Martes", value: "tuesday" },
                          { label: "Miércoles", value: "wednesday" },
                          { label: "Jueves", value: "thursday" },
                          { label: "Viernes", value: "friday" },
                          { label: "Sábado", value: "saturday" },
                          { label: "Domingo", value: "sunday" }
                      ].map(day => (
                          <button key={day.value} type="button" className={
                                  editForm.preferred_days.includes(day.value)
                                  ? "selectedDay"
                                  : ""} onClick={() => toggleDay(day.value)}>
                              {day.label}
                          </button>
                      ))}
                  </div>
                </>
              ) : (
                selectedEvent.extendedProps.isReminder ? (
                  <>
                    <h2>{selectedEvent.title}</h2>
                    <p>{selectedEvent.extendedProps.description}</p>
                    <p>Hora:{" "}{selectedEvent.extendedProps.reminder_time || "09:00"}</p>
                    <p>Fecha:{" "}{new Date(selectedEvent.start).toLocaleDateString("es-AR")}</p>
                  </>
                ) : (
                  <>
                    <h2>{selectedEvent.title}</h2>
                    <h3>{selectedEvent.extendedProps.description}</h3>
                    <p><h3>Monto:</h3> {
                        selectedEvent.extendedProps.amount == null
                          ? <span><TriangleAlert size={17}/>Clickeá Ver mail para encontrar el monto</span>
                          : formatCurrency(selectedEvent.extendedProps.amount)
                      }</p>

                    <p><h3>Vencimiento:</h3> {new Date(selectedEvent.start).toLocaleDateString("es-AR")}</p>

                    <p><h3>Estado del pago:</h3> {selectedEvent.extendedProps.paid ? "Pagado" : "Pendiente"}</p>
                    <p><h3>Método de pago:</h3> {selectedEvent.extendedProps.payment_method || "No definido"}</p>
                  </>
              )
            )}

            {!selectedEvent.extendedProps.isReminder &&(
              <>
              {!editing ? (
                <button onClick={() => setEditing(true)}>Editar</button>
              ) : (
                <button onClick={handleEdit}>Guardar cambios</button>
              )}               
                <button onClick={handleTogglePaid}>{selectedEvent.extendedProps.paid
                  ? "Marcar como NO pagado"
                  : "Marcar como pagado"}</button>
              </>
            )}
            
            
            <button onClick={selectedEvent.extendedProps.isReminder ? handleDeleteReminder : handleDelete}>Eliminar notificación</button>
            {selectedEvent.extendedProps.email_id && (
              <a
                href={`https://mail.google.com/mail/#inbox/${selectedEvent.extendedProps.email_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >Ver mail</a>
            )}

          </div>
        </div>
      )}

      {showReminderPopup && (
        <div className="calendarPopupOverlay" onClick={() => setShowReminderPopup(false)}>
          <div className="reminderPopup" style={{left: popupPosition.x, top: popupPosition.y}} onClick={(e) => e.stopPropagation()}>
              <button className="createReminderBtn"
                onClick={() => { setShowReminderModal(true); setShowReminderPopup(false);}}>
                ¿Crear recordatorio?
              </button>
          </div>
          </div>
      )}
      {showReminderModal && (
        <div className="modalOverlay" onClick={() => setShowReminderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo recordatorio</h2>
            <input placeholder="Nombre" value={reminderForm.title}
              onChange={(e) => setReminderForm({...reminderForm, title: e.target.value})}/>

            <input placeholder="Descripción" value={reminderForm.description}
              onChange={(e) => setReminderForm({...reminderForm, description: e.target.value})}/>

            <label>Horario del recordatorio <small>(opcional)</small></label>
            <small>Si no elegís uno, se utilizará 09:00 por defecto.</small>
            <input type="time" value={reminderForm.time}
              onChange={(e) => setReminderForm({...reminderForm, time: e.target.value})}/>

            <button onClick={createReminder}>
              Crear recordatorio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;