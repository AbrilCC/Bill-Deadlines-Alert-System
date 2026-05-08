import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { useEffect, useState } from "react";

const COLORS = [
  "#f7931e",
  "#22abe2",
  "#ed6a11",
  "#2e6e89", 
  "#f9be70",
];

function PaymentsChart() {

  const [data, setData] = useState([]);

  useEffect(() => {
  fetch("http://localhost:3000/dashboard/monthly-summary")
    .then(res => res.json())
    .then(data => {
      const daysInMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0
      ).getDate();

      const formatted = [];

      for (let i = 1; i <= daysInMonth; i++) {

        const found = data.find(d => Number(d.day) === i);

        formatted.push({
          day: i,
          total: found ? Number(found.total) : 0
        });
      }

      setData(formatted);

    });

}, []);

  return (
    <div className="dashboardCard chartCard">
      <h3>Pagos del mes</h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total">{data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[index % COLORS.length]}
              />
            ))}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PaymentsChart;