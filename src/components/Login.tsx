import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-4xl">⏰</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-800 mb-2">Welkom</h2>
          <p className="text-gray-600 text-2xl">Log in op je account</p>
        </div>
        {error && <p className="text-red-500 mb-6 text-center text-2xl bg-red-50 p-3 rounded-lg">{error}</p>}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-2xl">Gebruikersnaam</label>
            <input
              type="text"
              placeholder="Voer je gebruikersnaam in"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-5 border-2 border-gray-300 rounded-xl text-3xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-2xl">Wachtwoord</label>
            <input
              type="password"
              placeholder="Voer je wachtwoord in"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-5 border-2 border-gray-300 rounded-xl text-3xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50"
              required
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-2xl text-5xl font-bold min-h-[80px] mt-8 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
          Inloggen →
        </button>
        <div className="text-center mt-6">
          <p className="text-gray-600 text-xl">Werkuren Logger - Efficiënt tijdregistratie</p>
        </div>
      </form>
    </div>
  );
};

export default Login;