import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CreateSingle({ setView }) {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    due_date: "",
  });
  const [startDate, setStartDate] = useState(null); 

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/events/single", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setView("calendar");
    }

    alert("Evento creado");
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
          setForm({ ...form, due_date: date.toISOString() });
        }} dateFormat="dd/MM/yyyy" className="customDate"/>
      </div>

      <button type="submit">Guardar</button>
    </form>
  );
}