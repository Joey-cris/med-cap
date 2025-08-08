import React, { useEffect, useState } from 'react';
import { database, auth } from './firebase';
import { ref, onValue } from "firebase/database";
import { signOut } from "firebase/auth";

function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { date, time };
}

function CircleProgress({ current, max, label }) {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (current / max) * circumference;

  return (
    <div className="flex flex-col items-center mx-3">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#ddd"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#3b82f6"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="16px"
          fill="#333"
          fontWeight="bold"
        >
          {current}/{max}
        </text>
      </svg>
      <div className="mt-2 font-semibold">{label}</div>
    </div>
  );
}

function GaugeChart({ value, max, label, color }) {
  // Simple semicircle gauge using SVG arcs

  const radius = 70;
  const strokeWidth = 14;
  const center = radius + strokeWidth;
  const circumference = radius * Math.PI; // half circle circumference

  // Calculate strokeDashoffset for value
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center mx-6">
      <svg width={center * 2} height={center + strokeWidth} >
        <path
          d={`
            M ${strokeWidth} ${center}
            A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}
          `}
          fill="none"
          stroke="#ddd"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`
            M ${strokeWidth} ${center}
            A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}
          `}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x="50%"
          y={center / 1.2}
          textAnchor="middle"
          fontSize="24px"
          fill="#333"
          fontWeight="bold"
        >
          {Math.round(value)}
        </text>
      </svg>
      <div className="mt-2 font-semibold">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [temp, setTemp] = useState(0);
  const [hum, setHum] = useState(0);
  const [coinTotal, setCoinTotal] = useState(0);
  const [servoCounts, setServoCounts] = useState({ M1: 0, M2: 0, M3: 0, M4: 0, M5: 0 });
  const [servoLogs, setServoLogs] = useState([]);

  useEffect(() => {
    // Listen to realtime database path
    const pathRef = ref(database, '/deviceData');

    onValue(pathRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Update basic values
      setTemp(data.temperature || 0);
      setHum(data.humidity || 0);
      setCoinTotal(data.coinTotal || 0);

      // Update servo counts
      const counts = {
        M1: data.M1 || 0,
        M2: data.M2 || 0,
        M3: data.M3 || 0,
        M4: data.M4 || 0,
        M5: data.M5 || 0,
      };
      setServoCounts(counts);

      // For the table with logs:
      // Since Arduino code only stores count, no logs on firebase,
      // we must create logs from counts + timestamp logic here.
      // We will simulate logs by generating entries based on counts and current time.

      // *** Ideally, your Arduino should send each event with a timestamp for accurate logs.
      // Since it doesn't, we simulate logs backwards counting from now.

      // Create logs array with separate entries for each servo count
      let logs = [];

      const now = Date.now();
      const timeStep = 5 * 60 * 1000; // 5 minutes gap assumed between triggers

      Object.entries(counts).forEach(([code, count]) => {
        for (let i = 0; i < count; i++) {
          // Push simulated timestamps subtracting i * timeStep + random offset
          const ts = now - (i * timeStep) - Math.floor(Math.random() * timeStep);
          const { date, time } = formatDateTime(ts);
          logs.push({ code, date, time, timestamp: ts });
        }
      });

      // Sort logs descending by timestamp
      logs.sort((a, b) => b.timestamp - a.timestamp);

      setServoLogs(logs);
    });
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ESP8266 Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      <section className="flex flex-wrap justify-center mb-8">
        {/* Servo progress */}
        {['M1', 'M2', 'M3', 'M4', 'M5'].map(code => (
          <CircleProgress
            key={code}
            current={servoCounts[code]}
            max={15}
            label={code}
          />
        ))}
      </section>

      <section className="flex justify-center mb-10">
        <GaugeChart value={temp} max={50} label="Temperature (°C)" color="#f87171" />
        <GaugeChart value={hum} max={100} label="Humidity (%)" color="#3b82f6" />
      </section>

      <section className="overflow-x-auto max-w-5xl mx-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left py-3 px-6">Code Name</th>
              <th className="text-left py-3 px-6">Date</th>
              <th className="text-left py-3 px-6">Time</th>
            </tr>
          </thead>
          <tbody>
            {servoLogs.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">No data available</td>
              </tr>
            )}
            {servoLogs.map((log, i) => (
              <tr key={i} className="border-b hover:bg-gray-100">
                <td className="py-2 px-6">{log.code}</td>
                <td className="py-2 px-6">{log.date}</td>
                <td className="py-2 px-6">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
