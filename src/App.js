import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import Dashboard from './Dashboard';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1580281657529-47d1c11faad5?auto=format&fit=crop&w=1950&q=80')",
      }}
    >
      <div className="bg-white bg-opacity-90 backdrop-blur-sm p-8 rounded-2xl shadow-lg max-w-sm w-full text-center">
        {/* LOGO */}
        <img
          src="https://www.edarabia.com/wp-content/uploads/2012/05/12.12.jpg"
          alt="Southern Leyte State University Logo"
          className="mx-auto mb-4 w-24 h-24 object-contain rounded-full shadow-md"
        />

        {/* TITLE */}
        <h2 className="text-2xl mb-6 font-bold text-blue-800 tracking-wide">
          Admin Login
        </h2>

        {/* ERROR MESSAGE */}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {/* EMAIL INPUT */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border border-blue-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        {/* PASSWORD INPUT */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border border-blue-300 rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
        >
          Login
        </button>

        {/* FOOTER */}
        <p className="text-gray-500 text-sm mt-6">
          Southern Leyte State University • College of Medicine
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading)
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (!user) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
