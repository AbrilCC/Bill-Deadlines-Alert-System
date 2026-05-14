import PaymentsChart from "./PaymentsChart";
import Senders from "./Senders";
import Checklist from "./Checklist";

function Dashboard({trustedSenders, setTrustedSenders}) {
  return (
    <div className="dashboardGrid">
      
      <PaymentsChart />

      <Senders trustedSenders={trustedSenders} setTrustedSenders={setTrustedSenders}/>

      <Checklist />

    </div>
  );
}

export default Dashboard;