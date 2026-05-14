import PaymentsChart from "./PaymentsChart";
import Senders from "./Senders";
import Checklist from "./Checklist";

function Dashboard({trustedSenders, setTrustedSenders}) {
  return (
    <div className="dashboardGrid">
      
      <Checklist />

      <Senders trustedSenders={trustedSenders} setTrustedSenders={setTrustedSenders}/>

      <PaymentsChart />      

    </div>
  );
}

export default Dashboard;