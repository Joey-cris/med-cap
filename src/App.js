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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow max-w-sm w-full text-center"
      >
        {/* LOGO ABOVE ADMIN LOGIN */}
        <img
          src="https://www.edarabia.com/wp-content/uploads/2012/05/12.12.jpg"
          alt="Southern Leyte State University Logo"
          className="mx-auto mb-4 w-24 h-24 object-contain rounded-full"
        />

        {/* TITLE */}
        <h2 className="text-2xl mb-6 font-semibold text-gray-800">Admin Login</h2>

        {/* ERROR MESSAGE */}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        {/* EMAIL INPUT */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        {/* PASSWORD INPUT */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded mb-6"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {/* LOGIN BUTTON */}
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
