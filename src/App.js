import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import Dashboard from './Dashboard';
import logo from 'https://www.edarabia.com/wp-content/uploads/2012/05/12.12.jpg';

// ✅ LANDING PAGE COMPONENT
function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6">
      <img
        src={logo}
        alt="Southern Leyte State University Logo"
        className="w-[150px] h-[150px] object-contain mb-6"
      />
      <h1 className="text-4xl font-bold mb-4 text-center text-blue-800">
        Welcome to Southern Leyte State University Portal
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Manage administrative tasks, view analytics, and access your dashboard — all in one place.
      </p>
      <Link
        to="/login"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Go to Admin Login
      </Link>
    </div>
  );
}

// ✅ LOGIN COMPONENT (same as before)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow max-w-sm w-full">
        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt="Southern Leyte State University Logo"
            className="w-[120px] h-[120px] object-contain"
          />
        </div>

        <h2 className="text-2xl mb-6 font-semibold text-center">Admin Login</h2>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded mb-6"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

// ✅ PROTECTED ROUTE
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
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

// ✅ MAIN APP ROUTES
function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
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
