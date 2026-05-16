import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Bot,
  FolderCog,
  ArrowUpFromLine,
  AlertTriangle
} from "lucide-react";

function Sidebar({ setView, view, trustedSenders, userData }) {

  const missingTrustedSenders = trustedSenders.length === 0;

  return (
    <div className="sidebar">
        <div className="sidebarTitle">
            <img src="/logo/orange-round.png" alt="Logo" className="sidebarLogo"></img>
            <h2 style={{"color": "#fe6601"}}>Panel de control</h2>
        </div>

      <button className={view === "dashboard" ? "activeSidebar" : ""} onClick={() => setView("dashboard")}>
        <LayoutDashboard size={18} />
        Página principal
        {missingTrustedSenders && (<AlertTriangle size={18} color="#ff9800" />
)}
      </button>

      <button className={view === "calendar" ? "activeSidebar" : ""} onClick={() => setView("calendar")}>
        <Calendar size={18} />
        Calendario
      </button>

      <div className="sidebarDropdown">
        <button className="sidebarDropdownBtn">
          <CreditCard size={18} />
          Agregar vencimientos
        </button>

        <div className="sidebarDropdownContent">
          <button className={view === "single" ? "activeSidebar" : ""} onClick={() => setView("single")}>
            Vencimiento de pago único
          </button>

          <button className={view === "weekly" ? "activeSidebar" : ""} onClick={() => setView("weekly")}>
            Vencimiento de pago semanal
          </button>

          <button className={view === "monthly" ? "activeSidebar" : ""} onClick={() => setView("monthly")}>
            Vencimiento de pago mensual
          </button>
        </div>
      </div>

      <button className={view === "admin" ? "activeSidebar" : ""} onClick={() => setView("admin")}>
        <FolderCog size={18} />
        Administrar mis servicios
      </button>

      <button className={view === "uploadPDF" ? "activeSidebar" : ""} onClick={() => setView("uploadPDF")}>
        <ArrowUpFromLine size={18} />
        Cargá tu factura
      </button>

      <button onClick={() => window.open("https://t.me/payment_deadlines_alert_bot", "_blank")}>
        <Bot size={18} />
        Chatear con Boti        
      </button>

      <div className="sidebarUserInfo">
        <p className="sidebarUserEmail">
            {userData?.email}
        </p>
      </div>

    </div>
  );
};

export default Sidebar;