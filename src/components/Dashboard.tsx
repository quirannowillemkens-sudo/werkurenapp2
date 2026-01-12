import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import * as XLSX from 'xlsx';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [date, setDate] = useState(format(selectedDate, 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('work');
  const [editing, setEditing] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentType, setCurrentType] = useState('work');
  const [currentStart, setCurrentStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [summaries, setSummaries] = useState<{ date: string; totalHours: number; overwork: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  useEffect(() => {
    calculateSummaries();
  }, [logs]);

  useEffect(() => {
    if (!editing) {
      const dayLogs = logs.filter(log => log.date === date);
      if (dayLogs.length > 0) {
        const latestEnd = dayLogs.reduce((latest, log) => log.endTime && log.endTime > latest ? log.endTime : latest, '00:00');
        setStartTime(latestEnd);
      } else {
        setStartTime(format(new Date(), 'HH:mm'));
      }
    }
  }, [date, logs, editing]);

  useEffect(() => {
    setDate(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate]);

  const calculateSummaries = () => {
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {} as Record<string, Log[]>);

    const summaryList = Object.entries(grouped).map(([date, dayLogs]) => {
      const totalMinutes = dayLogs
        .filter(log => log.type === 'work')
        .reduce((sum, log) => {
          if (log.endTime) {
            const start = parseISO(`${log.date}T${log.startTime}`);
            const end = parseISO(`${log.date}T${log.endTime}`);
            return sum + differenceInMinutes(end, start);
          }
          return sum;
        }, 0);
      const totalHours = totalMinutes / 60;
      const standardHours = 8; // 8 hours work
      const overwork = Math.max(0, totalHours - standardHours);
      return { date, totalHours: Math.round(totalHours * 100) / 100, overwork: Math.round(overwork * 100) / 100 };
    });
    setSummaries(summaryList);
  };

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

  const startTimer = (type: 'work' | 'break' = 'work') => {
    if (isRunning) {
      // Stop current session and log it
      stopTimer();
    }
    setCurrentType(type);
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

  const startBreak = () => {
    stopTimer();
    startTimer('break');
  };

  const startWork = () => {
    stopTimer();
    startTimer('work');
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(log => ({
      Date: log.date,
      Start: log.startTime,
      End: log.endTime || '',
      Type: log.type
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Logs');
    XLSX.writeFile(wb, 'work_logs.xlsx');
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getHoursForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(log => log.date === dateStr && log.type === 'work');
    const totalMinutes = dayLogs.reduce((sum, log) => {
      if (log.endTime) {
        const start = parseISO(`${log.date}T${log.startTime}`);
        const end = parseISO(`${log.date}T${log.endTime}`);
        return sum + differenceInMinutes(end, start);
      }
      return sum;
    }, 0);
    return (totalMinutes / 60).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10 px-4">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Werkuren Logger</h1>
          <button onClick={handleLogout} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl text-5xl font-bold min-h-[72px] hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
            Uitloggen
          </button>
        </header>
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl mb-10 border border-white/50">
          <h2 className="text-3xl mb-8 font-bold text-gray-800 text-center">⏱️ Timer</h2>
          <div className="mb-8 text-center">
            <span className="text-5xl font-mono font-bold text-gray-800 bg-gray-100 px-6 py-3 rounded-2xl shadow-inner">{formatElapsedTime(elapsedTime)}</span>
            {isRunning && <span className="ml-4 text-xl font-semibold text-blue-600">({currentType === 'work' ? 'Werk' : 'Pauze'})</span>}
          </div>
          <div className="flex flex-col gap-6">
            {!isRunning ? (
              <button onClick={() => startTimer('work')} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
                ▶️ Start Werk
              </button>
            ) : currentType === 'work' ? (
              <>
                <button onClick={stopTimer} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
                  ⏹️ Stop
                </button>
                <button onClick={startBreak} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
                  ☕ Pauze
                </button>
              </>
            ) : (
              <>
                <button onClick={stopTimer} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
                  ⏹️ Stop
                </button>
                <button onClick={startWork} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
                  ▶️ Start Werk
                </button>
              </>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl mb-10 border border-white/50">
          <h2 className="text-3xl mb-8 font-bold text-gray-800 text-center">📝 {editing ? 'Log Bewerken' : 'Uren Loggen'}</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">📅 Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-5 border-2 border-gray-300 rounded-xl text-xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">🕐 Starttijd</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-5 border-2 border-gray-300 rounded-xl text-xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">🕐 Eindtijd (optioneel)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-5 border-2 border-gray-300 rounded-xl text-xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold mb-3 text-gray-700">🏷️ Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-5 border-2 border-gray-300 rounded-xl text-xl min-h-[72px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50">
                <option value="work">💼 Werk</option>
                <option value="break">☕ Pauze</option>
              </select>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4">
            <button type="submit" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl">
              {editing ? '✏️ Bijwerken' : '💾 Log'}
            </button>
            {editing && <button type="button" onClick={() => setEditing(null)} className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-8 py-5 rounded-2xl text-6xl font-bold min-h-[80px] hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-xl">❌ Annuleren</button>}
          </div>
        </form>
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl mb-10 border border-white/50">
          <h2 className="text-3xl mb-8 font-bold text-gray-800 text-center">📊 Dagelijkse Samenvatting</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[400px] text-xl bg-white rounded-2xl overflow-hidden shadow-lg">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <tr>
                  <th className="text-left p-4 font-bold">📅 Datum</th>
                  <th className="text-left p-4 font-bold">⏰ Totaal Uren</th>
                  <th className="text-left p-4 font-bold">⚡ Overwerk Uren</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(summary => (
                  <tr key={summary.date} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold">{summary.date}</td>
                    <td className="p-4 font-semibold text-blue-600">{summary.totalHours}u</td>
                    <td className="p-4 font-semibold text-red-600">{summary.overwork > 0 ? `${summary.overwork}u` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-white/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold text-gray-800">📅 Kalender</h2>
            <button onClick={exportToExcel} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl text-5xl font-bold min-h-[72px] hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-xl">
              📊 Exporteren naar Excel
            </button>
          </div>
          <div className="mb-8 bg-white rounded-2xl p-4 shadow-lg">
            <Calendar
              onClickDay={setSelectedDate}
              value={selectedDate}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const hours = getHoursForDate(date);
                  return hours !== '0.0' ? <p className="text-lg text-center font-bold text-blue-600">{hours}u</p> : null;
                }
                return null;
              }}
              className="w-full text-xl border-none"
              tileClassName="min-h-[80px] flex items-center justify-center hover:bg-blue-50 rounded-lg transition-colors"
            />
          </div>
          {selectedDate && (
            <div className="bg-white/90 p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-2xl mb-6 font-bold text-gray-800">📋 Logs voor {format(selectedDate, 'dd-MM-yyyy')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-[600px] text-lg bg-white rounded-xl overflow-hidden shadow-md">
                  <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    <tr>
                      <th className="text-left p-4 font-bold">🕐 Start</th>
                      <th className="text-left p-4 font-bold">🕐 Eind</th>
                      <th className="text-left p-4 font-bold">🏷️ Type</th>
                      <th className="text-left p-4 font-bold">⚙️ Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(log => log.date === format(selectedDate, 'yyyy-MM-dd')).map(log => (
                      <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-semibold">{log.startTime}</td>
                        <td className="p-4 font-semibold">{log.endTime || '-'}</td>
                        <td className="p-4 font-semibold">{log.type === 'work' ? '💼 Werk' : '☕ Pauze'}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-3">
                            <button onClick={() => editLog(log)} className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl text-4xl font-bold min-h-[60px] hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                              ✏️ Bewerken
                            </button>
                            <button onClick={() => deleteLog(log.id)} className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl text-4xl font-bold min-h-[60px] hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                              🗑️ Verwijderen
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;