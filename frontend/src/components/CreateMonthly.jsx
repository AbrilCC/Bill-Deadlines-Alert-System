import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateMonthly() {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    start_date: "",
    end_date: "",
    payment_frequency: "monthly",
  });
  const [startDate, setStartDate] = useState(null); 

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
    await fetch("http://localhost:3000/events/recurring", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form),
    });

    alert("Eventos generados");
  };

  return (
    <div className="card" id="formStyle">
      <h2>Agregar pagos mensuales</h2>

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
        <label>Primera cuota:</label>
        
        <DatePicker selected={startDate} onChange={(date) => {
          setStartDate(date);
          setForm({ ...form, start_date: date });
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

      <button onClick={handleSubmit}>Generar</button>
    </div>
  );
}