import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export default function CreateWeekly({ setView }) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    start_date: "",
    end_date: "",
    weekday: "",
    payment_frequency: "weekly",
  });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);  
  const [preferredDays, setPreferredDays] = useState([]);


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.type || !form.amount || !form.start_date) {
        alert("Completá todos los campos obligatorios");
        return;
    }
    const res = await fetch(`${BACKEND_API_URL}/events/weekly`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({...form, preferred_days: preferredDays}),
    });
    
    if (res.ok) {
      setView("calendar");
    }
    alert("Eventos generados");
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
    <div className="card" id="formStyle">
      <h2>Agregar pagos semanales</h2>

      <div className="formInputRow">
        <label>Nombre:</label>
        <input name="type" placeholder="Nombre (ej: Inglés)" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Descripción:</label>
        <input name="description" placeholder="Descripción (ej: clases de Cata)" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Monto:</label>
        <div className="inputWithSymbol">
          <span>$</span>
          <input type="number" step="0.01" min="0" name="amount" placeholder="El precio actual de cada cuota" onChange={handleChange} />
        </div>
      </div>

      <div className="formInputRow">
        <label>Fecha de inicio:</label>
        
        <DatePicker selected={startDate} onChange={(date) => {
        setStartDate(date);
        setForm({ ...form, start_date: date.toISOString(), weekday: date.getDay() });
        }} dateFormat="dd/MM/yyyy" className="customDate"/>
      </div>

      <div className="formInputRow">
        <div className="labelGroup">
          <p>Fecha final:</p>
          <small style={{"color": "#9b9b9b"}}>(Opcional, no seleccionar nada si el servicio no tiene una fecha de fin)</small>
        </div>        
        <DatePicker selected={endDate} onChange={(date) => {
        setEndDate(date);
        setForm({ ...form, end_date: date.toISOString() });
        }} dateFormat="dd/MM/yyyy" className="customDate"/>
      </div>

      <div className="suggestionsCard">
        <h3>💡 Bienvenido a la sección de sugerencias</h3>
        <p>Elegí qué días de la semana suelen quedarte cómodos para pagar este servicio, para recordártelo cerca de la fecha. Este paso es completamente opcional.</p>
        <div className="daysSelector">
            {[
                "Lunes",
                "Martes",
                "Miércoles",
                "Jueves",
                "Viernes",
                "Sábado",
                "Domingo"
            ].map(day => (
                <button type="button" key={day}
                    className={
                        preferredDays.includes(day)
                        ? "selectedDay"
                        : "" } onClick={() => toggleDay(day)}>
                    {day}
                </button>
            ))}
        </div>
      </div>

      <button onClick={handleSubmit}>Generar</button>
    </div>
  );
}