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
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://thumbs.dreamstime.com/b/medical-equipment-vending-machine-d-vector-web-banner-poster-protection-corona-virus-infection-flat-object-cartoon-212024659.jpg')",
      }}
    >
      {/* Overlay to darken background for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      <form
        onSubmit={handleLogin}
        className="relative bg-white bg-opacity-90 p-8 rounded-2xl shadow-xl max-w-sm w-full z-10 backdrop-blur-sm"
      >
        <div className="flex justify-center mb-4">
          <img
            src={logo}
            alt="Southern Leyte State University Logo"
            className="w-[120px] h-[120px] object-contain"
          />
        </div>

        <h2 className="text-2xl mb-6 font-semibold text-center text-gray-800">
          Admin Login
        </h2>

        {error && <p className="mb-4 text-red-600">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
