import React, { useEffect, useState } from 'react';
import { database, auth } from './firebase';
import { ref, onValue, set, push } from "firebase/database";
import { signOut } from "firebase/auth";

// 🕓 Format date and time
function formatDateTime(timestamp) {
  if (!timestamp) return { date: "N/A", time: "N/A" };
  const tsNum = Number(timestamp);
  if (isNaN(tsNum) || tsNum <= 0) return { date: "N/A", time: "N/A" };

  const d = new Date(tsNum * 1000);
  if (isNaN(d.getTime())) return { date: "N/A", time: "N/A" };

  const date = d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return { date, time };
}

// 🔁 Reset stock button
function resetCount(servoCode) {
  if (window.confirm(`Reset stock for ${servoCode}?`)) {
    set(ref(database, `/deviceData/${servoCode}`), 0)
      .then(() => alert(`${servoCode} stock reset.`))
      .catch(err => alert(`Error: ${err.message}`));
  }
}

// ⚙️ Circle Progress for Medicine
function CircleProgress({ current, max }) {
  const radius = 35;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (current / max) * circumference;

  const color =
    current >= 15 ? "#dc2626" :        // Red (Out of stock)
    current >= 10 ? "#f59e0b" :        // Yellow (Low stock)
    "#0ea5e9";                         // Blue (Normal)

  return (
    <svg height={radius * 2} width={radius * 2}>
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
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
        fontSize="14px"
        fill="#111"
        fontWeight="bold"
      >
        {current}/{max}
      </text>
    </svg>
  );
}

// 🌡️ Gauge for Temperature & Humidity
function GaugeChart({ value, max, label, color, icon }) {
  const radius = 70;
  const strokeWidth = 14;
  const center = radius + strokeWidth;
  const circumference = radius * Math.PI;
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="flex flex-col items-center bg-white shadow rounded-2xl p-6 mx-4">
      <svg width={center * 2} height={center + strokeWidth}>
        <path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${center * 2 - strokeWidth} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="50%"
          y={center / 1.2}
          textAnchor="middle"
          fontSize="22px"
          fill="#111"
          fontWeight="bold"
        >
          {Math.round(value)}
        </text>
      </svg>
      <div className="mt-3 flex items-center gap-2 text-gray-700 font-semibold">
        <span className="material-icons text-xl" style={{ color }}>
          {icon}
        </span>
        {label}
      </div>
    </div>
  );
}

// 📊 MAIN DASHBOARD
export default function Dashboard() {
  const [temp, setTemp] = useState(0);
  const [hum, setHum] = useState(0);
  const [servoCounts, setServoCounts] = useState({ M1: 0, M2: 0, M3: 0, M4: 0, M5: 0 });
  const [servoLogs, setServoLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Fetch from Firebase
  useEffect(() => {
    const deviceRef = ref(database, "/deviceData");
    const logsRef = ref(database, "/deviceData/logs");
    const notifRef = ref(database, "/notifications");

    onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      setTemp(data.temperature || 0);
      setHum(data.humidity || 0);
      setServoCounts({
        M1: data.M1 || 0,
        M2: data.M2 || 0,
        M3: data.M3 || 0,
        M4: data.M4 || 0,
        M5: data.M5 || 0,
      });
    });

    onValue(logsRef, (snapshot) => {
      const logsData = snapshot.val();
      if (!logsData) {
        setServoLogs([]);
        return;
      }
      let allLogs = [];
      for (const servoCode in logsData) {
        const servoLogsData = logsData[servoCode];
        for (const key in servoLogsData) {
          allLogs.push(servoLogsData[key]);
        }
      }
      allLogs.sort((a, b) => b.timestamp - a.timestamp);
      setServoLogs(allLogs);
    });

    onValue(notifRef, (snapshot) => {
      const notifData = snapshot.val();
      if (!notifData) {
        setNotifications([]);
        return;
      }
      const notifList = Object.values(notifData).sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(notifList);
    });
  }, []);

  // ⚠️ Notification trigger when M1–M5 reach certain levels
  useEffect(() => {
    Object.entries(servoCounts).forEach(([code, count]) => {
      let message = "";
      if (count >= 10 && count < 15) message = "Refill medicine — almost out.";
      else if (count >= 15) message = "Medicine is out of stock.";

      if (message) {
        const timestamp = Math.floor(Date.now() / 1000);
        const notifRef = ref(database, `/notifications`);
        const newNotif = { code, message, timestamp };
        push(notifRef, newNotif);
        alert(`⚠️ ${code}: ${message}`);
      }
    });
  }, [servoCounts]);

  // 🔓 Logout
  const handleLogout = () => signOut(auth);

  // 📁 Export Logs to CSV
  const downloadCSV = () => {
    if (servoLogs.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ["Medicine", "Date", "Time"];
    const rows = servoLogs.map((log) => {
      const { date, time } = formatDateTime(log.timestamp);
      return [log.code, date, time];
    });
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "medicine_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🧾 Medicine list with images
  const medicines = [
    { code: "M1", name: "Biogesic (Paracetamol)", img: "https://medsgo.ph/images/detailed/35/Biogesic_43iz-v8.png" },
    { code: "M2", name: "Alaxan FR", img: "https://cdn.store-assets.com/s/377840/i/19012688.jpg" },
    { code: "M3", name: "Decolgen Forte", img: "https://cdn.tgdd.vn/Products/Images/10022/131076/decolgen-forte-100v-2-1.jpg" },
    { code: "M4", name: "Neozep", img: "https://assets.unilab.com.ph/uploads/Common/Neozep/Z_plus_Forte_768x768.webp" },
    { code: "M5", name: "Tuseran Forte", img: "https://biggrocer.com.ph/wp-content/uploads/2021/06/157209-Tile-3-1536x1536.jpg" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-teal-700 flex items-center gap-2">
          <span className="material-icons">local_pharmacy</span> Vendo Medicine Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="bg-rose-600 text-white px-4 py-2 rounded-full hover:bg-rose-700 transition"
        >
          Logout
        </button>
      </header>

      {/* 🔔 Notification Bar */}
      {notifications.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
            <span className="material-icons text-yellow-600">notification_important</span>
            Notifications
          </h2>
          <ul className="list-disc list-inside">
            {notifications.slice(0, 5).map((notif, i) => {
              const { date, time } = formatDateTime(notif.timestamp);
              return (
                <li key={i}>
                  <b>{notif.code}</b> — {notif.message}{" "}
                  <span className="text-sm text-gray-500">
                    ({date} {time})
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 🧮 Medicine Stock Display with Images */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
        {medicines.map((med) => (
          <div
            key={med.code}
            className="flex flex-col items-center bg-white shadow rounded-2xl p-4 w-44 hover:shadow-lg transition"
          >
            <img
              src={med.img}
              alt={med.name}
              className="w-24 h-24 object-contain mb-3 rounded-lg"
            />
            <CircleProgress current={servoCounts[med.code]} max={15} />
            <div className="mt-2 text-gray-700 font-medium text-center">{med.name}</div>
            <button
              onClick={() => resetCount(med.code)}
              className="mt-3 bg-rose-500 text-white px-3 py-1 rounded-full text-xs hover:bg-rose-600"
            >
              Reset
            </button>
          </div>
        ))}
      </section>

      {/* 🌡️ Environment Display */}
      <section className="flex justify-center mb-10 flex-wrap">
        <GaugeChart value={temp} max={50} label="Storage Temp (°C)" color="#14b8a6" icon="thermostat" />
        <GaugeChart value={hum} max={100} label="Storage Humidity (%)" color="#0ea5e9" icon="water_drop" />
      </section>

      {/* 🧾 Notification Table */}
      <section className="overflow-x-auto max-w-5xl mx-auto mb-10">
        <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <span className="material-icons text-amber-600">notifications</span>
          Notification Records
        </h2>
        <table className="min-w-full bg-white rounded-2xl shadow overflow-hidden">
          <thead>
            <tr className="bg-amber-600 text-white">
              <th className="text-left py-3 px-6">Medicine</th>
              <th className="text-left py-3 px-6">Message</th>
              <th className="text-left py-3 px-6">Date</th>
              <th className="text-left py-3 px-6">Time</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-4 text-gray-500">
                  No notifications yet
                </td>
              </tr>
            ) : (
              notifications.map((notif, i) => {
                const { date, time } = formatDateTime(notif.timestamp);
                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-6">{notif.code}</td>
                    <td className="py-2 px-6">{notif.message}</td>
                    <td className="py-2 px-6">{date}</td>
                    <td className="py-2 px-6">{time}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* 🧾 Medicine Logs Table */}
      <section className="overflow-x-auto max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
            <span className="material-icons text-teal-600">assignment</span>
            Medicine Logs
          </h2>
          <button
            onClick={downloadCSV}
            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 transition shadow"
          >
            Export CSV
          </button>
        </div>
        <table className="min-w-full bg-white rounded-2xl shadow overflow-hidden">
          <thead>
            <tr className="bg-teal-600 text-white">
              <th className="text-left py-3 px-6">Medicine</th>
              <th className="text-left py-3 px-6">Date</th>
              <th className="text-left py-3 px-6">Time</th>
            </tr>
          </thead>
          <tbody>
            {servoLogs.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center p-4 text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              servoLogs.map((log, i) => {
                const { date, time } = formatDateTime(log.timestamp);
                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-6">{log.code}</td>
                    <td className="py-2 px-6">{date}</td>
                    <td className="py-2 px-6">{time}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
