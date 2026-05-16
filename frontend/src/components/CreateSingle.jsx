import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export default function CreateSingle({ setView }) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    due_date: "",
    
  });
  const [startDate, setStartDate] = useState(null); 
  const [preferredDays, setPreferredDays] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`${BACKEND_API_URL}/events/single`, {
      method: "POST",
      headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
      body: JSON.stringify({...form, preferred_days: preferredDays, source: "manual"}),
    });
    if (res.ok) {
      setTimeout(() => {setView("calendar");}, 200); 
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
    <form onSubmit={handleSubmit} className="card" id="formStyle">
      <h2>Agregar un pago único</h2>

      <div className="formInputRow">
        <label>Nombre:</label>
        <input name="type" required placeholder="Nombre (ej: Vacunas)" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Descripción:</label>
        <input name="description" placeholder="Descripción (ej: de Agus )" onChange={handleChange} />
      </div>

      <div className="formInputRow">
        <label>Monto:</label>
        <div className="inputWithSymbol">
          <span>$</span>
          <input name="amount" required type="number" step="0.01" min="0"  placeholder="" onChange={handleChange} />
        </div>
      </div>

      <div className="formInputRow">
        <label>Fecha de vencimiento:</label>        
        <DatePicker selected={startDate} onChange={(date) => {
          setStartDate(date);
          const localDate =`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

          setForm({ ...form, due_date: localDate});
        }} dateFormat="dd/MM/yyyy" className="customDate"/>
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

      <button type="submit">Guardar</button>
    </form>
  );
}