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
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-3xl mb-6 text-center">Inloggen</h2>
        {error && <p className="text-red-500 mb-6 text-center text-lg">{error}</p>}
        <input
          type="text"
          placeholder="Gebruikersnaam"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-4 mb-4 border rounded text-xl min-h-[64px]"
          required
        />
        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 mb-6 border rounded text-xl min-h-[64px]"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-4 rounded text-2xl min-h-[72px]">Inloggen</button>
      </form>
    </div>
  );
};

export default Login;