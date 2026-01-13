import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Alert } from './ui';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 sm:p-6">
      <Card variant="elevated" hover={false} className="w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110">
            <span className="text-4xl">⏰</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Werkuren Logger
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Log in op je account om door te gaan
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <Alert 
              type="error" 
              message={error}
              onClose={() => setError('')}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Gebruikersnaam"
            type="text"
            placeholder="Voer je gebruikersnaam in"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
            icon="👤"
          />

          <Input
            label="Wachtwoord"
            type="password"
            placeholder="Voer je wachtwoord in"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            icon="🔒"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            icon="→"
          >
            Inloggen
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-slate-600 text-xs sm:text-sm">
            Efficiënt werkuur registratie systeem
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;