import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

type Log = {
  id: string;
  date: string;
  startTime: string;
  endTime: string | null;
  type: string;
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<Log[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('work');
  const [editing, setEditing] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentType, setCurrentType] = useState('work');
  const [currentStart, setCurrentStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  useEffect(() => {
    let interval: number | null = null;
    if (isRunning && currentStart) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - currentStart.getTime());
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentStart]);

  const fetchLogs = () => {
    const storedLogs = localStorage.getItem('workLogs');
    if (storedLogs) {
      const parsedLogs = JSON.parse(storedLogs);
      const updatedLogs = parsedLogs.map((log: any) => ({ ...log, type: log.type || 'work' }));
      setLogs(updatedLogs);
    }
  };

  const saveLogs = (newLogs: Log[]) => {
    localStorage.setItem('workLogs', JSON.stringify(newLogs));
    setLogs(newLogs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const logData: Log = { id: editing || Date.now().toString(), date, startTime, endTime: endTime || null, type };
    if (editing) {
      const updatedLogs = logs.map(log => log.id === editing ? logData : log);
      saveLogs(updatedLogs);
      setEditing(null);
    } else {
      saveLogs([...logs, logData]);
    }
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime(format(new Date(), 'HH:mm'));
    setEndTime('');
  };

  const startTimer = () => {
    setCurrentStart(new Date());
    setIsRunning(true);
  };

  const stopTimer = () => {
    if (currentStart) {
      const end = new Date();
      const logData: Log = {
        id: Date.now().toString(),
        date: format(currentStart, 'yyyy-MM-dd'),
        startTime: format(currentStart, 'HH:mm'),
        endTime: format(end, 'HH:mm'),
        type: currentType
      };
      saveLogs([...logs, logData]);
      setIsRunning(false);
      setCurrentStart(null);
      setElapsedTime(0);
    }
  };

  const editLog = (log: Log) => {
    setEditing(log.id);
    setDate(log.date);
    setStartTime(log.startTime);
    setEndTime(log.endTime || '');
    setType(log.type);
  };

  const deleteLog = (id: string) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    saveLogs(updatedLogs);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Work Hours Logger</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </header>
        <div className="bg-white p-6 rounded shadow-md mb-8">
          <h2 className="text-xl mb-4">Timer</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select value={currentType} onChange={(e) => setCurrentType(e.target.value)} className="p-2 border rounded">
              <option value="work">Work</option>
              <option value="break">Break</option>
            </select>
          </div>
          <div className="mb-4">
            <span className="text-2xl font-mono">{formatElapsedTime(elapsedTime)}</span>
          </div>
          <div>
            {!isRunning ? (
              <button onClick={startTimer} className="bg-green-500 text-white px-4 py-2 rounded mr-2">Start</button>
            ) : (
              <button onClick={stopTimer} className="bg-red-500 text-white px-4 py-2 rounded mr-2">Stop</button>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mb-8">
          <h2 className="text-xl mb-4">{editing ? 'Edit Log' : 'Log Hours'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">End Time (optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded">
                <option value="work">Work</option>
                <option value="break">Break</option>
              </select>
            </div>
          </div>
          <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            {editing ? 'Update' : 'Log'}
          </button>
          {editing && <button type="button" onClick={() => setEditing(null)} className="mt-4 ml-4 bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>}
        </form>
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl mb-4">Your Logs</h2>
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Start</th>
                <th className="text-left p-2">End</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-2">{log.date}</td>
                  <td className="p-2">{log.startTime}</td>
                  <td className="p-2">{log.endTime || '-'}</td>
                  <td className="p-2">{log.type}</td>
                  <td className="p-2">
                    <button onClick={() => editLog(log)} className="text-blue-500 mr-2">Edit</button>
                    <button onClick={() => deleteLog(log.id)} className="text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;