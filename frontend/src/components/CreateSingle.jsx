import { useState } from "react";

export default function CreateSingle() {
  const [form, setForm] = useState({
    type: "",
    description: "",
    amount: "",
    due_date: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await fetch("http://localhost:3000/events/single", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form),
    });

    alert("Evento creado");
  };

  return (
    <div className="card" id="formStyle">
      <h2>Agregar un pago único</h2>

      <input name="type" placeholder="Nombre (ej: Vacunas)" onChange={handleChange} />
      <input name="description" placeholder="Descripción (ej: de Agus)" onChange={handleChange} />
      <input name="amount" placeholder="Monto" onChange={handleChange} />
      <input type="datetime-local" name="due_date" onChange={handleChange} />

      <button onClick={handleSubmit}>Guardar</button>
    </div>
  );
}