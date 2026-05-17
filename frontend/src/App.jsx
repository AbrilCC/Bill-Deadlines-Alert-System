import { useState, useEffect } from 'react'
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/dashboard/Dashboard";
import Calendar from "./components/Calendar";
import Admin from "./components/Admin";
import UploadManual from "./components/UploadManual";
import CreateSingle from "./components/CreateSingle";
import CreateWeekly from "./components/CreateWeekly";
import CreateMonthly from "./components/CreateMonthly";
import Auth from "./Login";
import "../styles.css"
import { LogIn } from "lucide-react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
    const token = localStorage.getItem("token");    
    const [trustedSenders, setTrustedSenders] = useState([]);
    const [gmailConnected, setGmailConnected] = useState(false);
    const [userData, setUserData] = useState(null);
    const [view, setView] = useState("dashboard");

    async function fetchUserData() {
        const token = localStorage.getItem("token");

        const res = await fetch(`${BACKEND_API_URL}/users/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        setUserData(data);
    }

    const fetchDashboardStatus = async () => {
        const res = await fetch(
        `${BACKEND_API_URL}/dashboard/status`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        );
        const data = await res.json();
        setTrustedSenders(data.trusted_senders || []);
        setGmailConnected(data.gmail_connected);
    };

    useEffect(() => {
        if (token) {
            fetchDashboardStatus();
            fetchUserData();
        }
    }, [token]);

    if (!token) {
        return <Auth />;    //Only show the site to registered users
    }

  return (
    <div>
        <div className="topbar">
            <h2>Mango - Sistema de alerta de vencimientos</h2>

            <div className="menu">
                <button onClick={() => setView("dashboard")}>Inicio</button>
                <span className="divider">|</span>
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.location.reload();
                    }}
                    >
                    Cerrar Sesión
                    <LogIn size={25} />
                    </button>

            </div>
        </div>

            <div className="appLayout">

            <Sidebar setView={setView} view={view} trustedSenders={trustedSenders} userData={userData}/>

            <div className="mainContent">

                {view === "dashboard" && <Dashboard trustedSenders={trustedSenders} setTrustedSenders={setTrustedSenders}/>}

                {view === "calendar" && <Calendar gmailConnected={gmailConnected} userData={userData}/>}

                {view === "admin" && <Admin />}

                {view === "uploadPDF" && <UploadManual />}

                {view === "single" && (
                    <CreateSingle setView={setView} />
                )}

                {view === "weekly" && (
                    <CreateWeekly setView={setView} />
                )}

                {view === "monthly" && (
                    <CreateMonthly setView={setView} />
                )}

            </div>

        </div>
    </div>
    );
}

export default App
