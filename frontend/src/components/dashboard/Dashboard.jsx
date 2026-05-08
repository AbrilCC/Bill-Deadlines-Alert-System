import PaymentsChart from "./PaymentsChart";
import GmailCard from "./GmailCard";

function Dashboard() {
  return (
    <div className="dashboardGrid">

      <GmailCard />
      
      <PaymentsChart />

    </div>
  );
}

export default Dashboard;