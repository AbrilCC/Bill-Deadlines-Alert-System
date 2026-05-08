import { useState } from 'react'
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import Calendar from "./components/Calendar";
import CreateSingle from "./components/CreateSingle";
import CreateWeekly from "./components/CreateWeekly";
import CreateMonthly from "./components/CreateMonthly";
import AutoEvents from "./components/AutoEvents";
import Auth from "./Login";
import "../styles.css"
import { LogIn } from "lucide-react";

function App() {
    const token = localStorage.getItem("token");    
    const [view, setView] = useState("dashboard");

    /*if (!token) {
        return <Auth />;    //Only show the site to registered users
    }*/

  return (
    <div>
        <div className="topbar">
            <h2>Sistema de Vencimientos de Pagos</h2>

            <div className="menu">
                <button onClick={() => setView("dashboard")}>Inicio</button>
                <span className="divider">|</span>
                <button onClick={() => setView("login")}>
                    Login
                    <LogIn size={25} />              
                    </button>
            </div>
        </div>

            <div className="appLayout">

            <Sidebar setView={setView} view={view}/>

            <div className="mainContent">

                {view === "dashboard" && <Dashboard />}

                {view === "calendar" && <Calendar />}

                {view === "single" && (
                    <CreateSingle setView={setView} />
                )}

                {view === "weekly" && (
                    <CreateWeekly setView={setView} />
                )}

                {view === "monthly" && (
                    <CreateMonthly setView={setView} />
                )}

                {view === "auto" && <AutoEvents />}

            </div>

        </div>
    </div>
    );
}

export default App
