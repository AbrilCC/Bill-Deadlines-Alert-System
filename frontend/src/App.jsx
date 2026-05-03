import { useState } from 'react'
import Calendar from "./components/Calendar";
import "./styles.css"

function App() {
    const [view, setView] = useState("calendar");   //This is read as: view starts as ="calendar", can be changed using setView

  return (
    <div>
        {/* TOPBAR */}
        <div className="topbar">
            <h2>Sistema de Vencimientos de Pagos</h2>
        </div>

        {/* SIDEBAR */}
        <div className="sidebar">
            <h3>Panel</h3>
            <button onClick={() => setView("calendar")}>Calendario</button>
            <button onClick={() => setView("create")}>Agregar actividad</button>
        </div>

        {/* MAIN */}
        <div className="main">
            {view === "calendar" && <Calendar/>}
            {view === "create" && <div>Formulario</div>}
        </div>
    </div>
  );
}

export default App
