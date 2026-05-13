import PaymentsChart from "./PaymentsChart";
import Senders from "./Senders";

function Dashboard({trustedSenders, setTrustedSenders}) {
  return (
    <div className="dashboardGrid">
      
      <PaymentsChart />

      <Senders trustedSenders={trustedSenders} setTrustedSenders={setTrustedSenders}/>

    </div>
  );
}

export default Dashboard;