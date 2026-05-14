import PaymentsChart from "./PaymentsChart";
import Senders from "./Senders";
import Checklist from "./Checklist";

function Dashboard({trustedSenders, setTrustedSenders}) {
  return (
    <div className="dashboardGrid">
      
      <Senders trustedSenders={trustedSenders} setTrustedSenders={setTrustedSenders}/>

      <Checklist />

      <PaymentsChart />      

    </div>
  );
}

export default Dashboard;