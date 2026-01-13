import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (login(username, password)) {
        navigate('/');
      } else {
        setError('Ongeldige gebruikersnaam of wachtwoord');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE5YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOS4wNiAwIDE5czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-2xl border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4 transform hover:scale-110 transition-transform duration-300">
              <span className="text-5xl">⏰</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
              Werkuren Logger
            </h1>
            <p className="text-white/80 text-lg">
              Log in om te beginnen
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/20 backdrop-blur-sm border-2 border-red-300 text-white p-4 rounded-xl flex items-center justify-between animate-in">
              <span className="font-semibold">{error}</span>
              <button onClick={() => setError('')} className="text-2xl hover:scale-110 transition-transform">✕</button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white font-bold mb-2 text-sm">
                Gebruikersnaam
              </label>
              <input
                type="text"
                placeholder="Voer je gebruikersnaam in"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white focus:outline-none transition-all text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-white font-bold mb-2 text-sm">
                Wachtwoord
              </label>
              <input
                type="password"
                placeholder="Voer je wachtwoord in"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-4 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white focus:outline-none transition-all text-lg font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 text-purple-600 font-black py-4 px-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Inloggen...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>Inloggen</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Gebruik je werkuren credentials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
