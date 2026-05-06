import { useState } from 'react'
import Calendar from "./components/Calendar";
import CreateSingle from "./components/CreateSingle";
import CreateMonthly from "./components/CreateMonthly";
import AutoEvents from "./components/AutoEvents";
import "../styles.css"

function App() {
    const [view, setView] = useState("calendar");   //This is read as: view starts as ="calendar", can be changed using setView

  return (
    <div>
        {/* TOPBAR */}
        <div className="topbar">
            <h2>Sistema de Vencimientos de Pagos</h2>
        </div>

        <div className="app-container">
            {/* SIDEBAR */}
            <div className="sidebar">
                <h3>Panel</h3>
                <button onClick={() => setView("calendar")}>Calendario</button>
                <button onClick={() => setView("single")}>Agregar pago único</button>
                <button onClick={() => setView("monthly")}>Agregar pagos mensuales</button>
                <button onClick={() => setView("auto")}>Ver mis pagos automáticos</button>
            </div>

            {/* MAIN */}
            <div className="main">
                {view === "calendar" && <Calendar key={view} />}
                {view === "single" && <CreateSingle setView={setView} />}
                {view === "monthly" && <CreateMonthly setView={setView} />}
                {view === "auto" && <AutoEvents />}
            </div>
        </div>
    </div>
  );
}

export default App
