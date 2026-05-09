import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Bot
} from "lucide-react";

function Sidebar({ setView, view }) {
  return (
    <div className="sidebar">
        <div className="sidebarTitle">
            <img src="logo/orange-round.png" className="sidebarLogo"></img>
            <h2 style={{"color": "#fe6601"}}>Panel de control</h2>
        </div>
                
        
      

      <button className={view === "dashboard" ? "activeSidebar" : ""} onClick={() => setView("dashboard")}>
        <LayoutDashboard size={18} />
        Página principal
      </button>

      <button className={view === "calendar" ? "activeSidebar" : ""} onClick={() => setView("calendar")}>
        <Calendar size={18} />
        Calendario
      </button>

      <button className={view === "single" ? "activeSidebar" : ""} onClick={() => setView("single")}>
        <CreditCard size={18} />
        Agregar pago único
      </button>
      
      <button className={view === "weekly" ? "activeSidebar" : ""} onClick={() => setView("weekly")}>
        <CreditCard size={18} />
        Agregar pagos semanales
      </button>

      <button className={view === "monthly" ? "activeSidebar" : ""} onClick={() => setView("monthly")}>
        <CreditCard size={18} />
        Agregar pagos mensuales
      </button>

      <button onClick={() => window.open("https://t.me/payment_deadlines_alert_bot", "_blank")}>
        <Bot size={18} />
        Chatear con Boti        
      </button>

    </div>
  );
};

export default Sidebar;