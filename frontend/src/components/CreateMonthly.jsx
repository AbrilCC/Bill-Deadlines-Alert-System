import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export default function CreateMonthly({ setView }) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    start_date: "",
    end_date: "",
    payment_frequency: "monthly",
  });
  const [startDate, setStartDate] = useState(null); 
  const [preferredDays, setPreferredDays] = useState([]);

  const generateMonths = () => {
    const months = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);

      const label = d.toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      });

      months.push({
        value: d.toISOString(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
    }
    return months;
  };

  const months = generateMonths();
  

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BACKEND_API_URL}/events/monthly`, {
      method: "POST",
      headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
      body: JSON.stringify({...form, preferred_days: preferredDays, source: "manual"}),
    });
    if (res.ok) {
      setView("calendar");
    }
  };

  function toggleDay(day) {
        if (preferredDays.includes(day)) {
            setPreferredDays(
                preferredDays.filter(d => d !== day)
            );
        } else {
            setPreferredDays([...preferredDays, day]);
        }
    };

  return (
    <form className="card" id="formStyle" onSubmit={handleSubmit}>
      <h2>Agregar pagos mensuales</h2>

      <div className="formInputRow">
        <label>Nombre:</label>
        <input name="type" required placeholder="Nombre (ej: Inglés)" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Descripción:</label>
        <input name="description" required placeholder="Descripción (ej: clases de Cata)" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Monto:</label>
        <div className="inputWithSymbol">
          <span>$</span>
          <input type="number" required step="0.01" min="0" name="amount" placeholder="El precio actual de cada cuota" onChange={handleChange} />
        </div>
      </div>

      <div className="formInputRow">
        <label>Primera cuota:</label>
        
        <DatePicker required selected={startDate} onChange={(date) => {
          setStartDate(date);
          setForm({ ...form, start_date: date.toISOString() });
        }} dateFormat="dd/MM/yyyy" className="customDate"/>
      </div>

      <div className="formInputRow">
        <div className="labelGroup">
          <p>Último mes de pago:</p>
          <small style={{"color": "#9b9b9b"}}>(Opcional, no seleccionar nada si el servicio no tiene una fecha de fin)</small>
        </div>
        
        <select name="end_date" onChange={handleChange} className="smallSelect">
          <option value="">Seleccionar</option>
          {months.map((m, i) => (
            <option key={i} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div className="suggestionsCard">
        <h3>💡 Bienvenido a la sección de sugerencias</h3>
        <p>Elegí qué días de la semana suelen quedarte cómodos para pagar este servicio, para recordártelo cerca de la fecha. Este paso es completamente opcional.</p>
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
                <button type="button" key={day.value}
                    className={
                        preferredDays.includes(day.value)
                        ? "selectedDay"
                        : "" } onClick={() => toggleDay(day.value)}>
                    {day.label}
                </button>
            ))}
        </div>
      </div>

      <button type="submit">Generar</button>
    </form>
  );
}