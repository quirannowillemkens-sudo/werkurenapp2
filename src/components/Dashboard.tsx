import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
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
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('work');
  const [editing, setEditing] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentType, setCurrentType] = useState('work');
  const [currentStart, setCurrentStart] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [summaries, setSummaries] = useState<{ date: string; totalHours: number; overwork: number }[]>([]);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  useEffect(() => {
    calculateSummaries();
  }, [logs]);

  useEffect(() => {
    let interval: number;
    if (isRunning && currentStart) {
      interval = window.setInterval(() => {
        setElapsedTime(new Date().getTime() - currentStart.getTime());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentStart]);

  const fetchLogs = () => {
    const stored = localStorage.getItem(`logs_${user}`);
    if (stored) setLogs(JSON.parse(stored));
  };

  const saveLogs = (newLogs: Log[]) => {
    setLogs(newLogs);
    localStorage.setItem(`logs_${user}`, JSON.stringify(newLogs));
  };

  const calculateSummaries = () => {
    const grouped: Record<string, { work: number; break: number }> = {};
    logs.forEach(log => {
      if (!grouped[log.date]) grouped[log.date] = { work: 0, break: 0 };
      if (log.endTime) {
        const mins = differenceInMinutes(log.endTime, log.startTime);
        grouped[log.date][log.type === 'work' ? 'work' : 'break'] += mins;
      }
    });

    const summaryList = Object.entries(grouped)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .slice(0, 14)
      .map(([date, times]) => ({
        date,
        totalHours: (times.work / 60).toFixed(1),
        overwork: Math.max(0, (times.work - 480) / 60).toFixed(1)
      }));
    setSummaries(summaryList as any);
  };

  const startTimer = (timerType: string) => {
    setCurrentStart(new Date());
    setIsRunning(true);
    setCurrentType(timerType);
    setElapsedTime(0);
  };

  const stopTimer = () => {
    if (currentStart && isRunning) {
      const minutes = Math.floor(differenceInMinutes(new Date(), currentStart));
      if (minutes > 0) {
        const endTimeStr = format(new Date(), 'HH:mm');
        const newLog: Log = {
          id: Date.now().toString(),
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: format(currentStart, 'HH:mm'),
          endTime: endTimeStr,
          type: currentType
        };
        saveLogs([...logs, newLog]);
        setFeedback({ type: 'success', message: `${minutes} minuten gelogd` });
      }
    }
    setIsRunning(false);
    setCurrentStart(null);
    setElapsedTime(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const updated = logs.map(log => 
        log.id === editing ? { ...log, date, startTime, endTime: endTime || null, type } : log
      );
      saveLogs(updated);
      setFeedback({ type: 'success', message: 'Log bijgewerkt' });
    } else {
      const newLog: Log = {
        id: Date.now().toString(),
        date,
        startTime,
        endTime: endTime || null,
        type
      };
      saveLogs([...logs, newLog]);
      setFeedback({ type: 'success', message: 'Log opgeslagen' });
    }
    setEditing(null);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime(format(new Date(), 'HH:mm'));
    setEndTime('');
  };

  const editLog = (log: Log) => {
    setEditing(log.id);
    setDate(log.date);
    setStartTime(log.startTime);
    setEndTime(log.endTime || '');
    setType(log.type);
  };

  const deleteLog = (id: string) => {
    saveLogs(logs.filter(log => log.id !== id));
    setFeedback({ type: 'success', message: 'Log verwijderd' });
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
      Type: log.type === 'work' ? 'Werk' : 'Pauze'
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Werkuren');
    XLSX.writeFile(wb, `werkuren_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    setFeedback({ type: 'success', message: 'Bestand gedownload' });
  };

  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getHoursForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLogs = logs.filter(log => log.date === dateStr && log.type === 'work' && log.endTime);
    return (dayLogs.reduce((sum, log) => sum + differenceInMinutes(log.endTime!, log.startTime) / 60, 0)).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Werkuren Logger
                </h1>
                <p className="text-sm text-gray-600">Welkom, {user}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium"
            >
              <span>🚪</span>
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-4 rounded-xl border-2 ${
            feedback.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          } flex items-center justify-between shadow-sm animate-in`}>
            <span className="font-medium">{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="text-xl hover:scale-110 transition-transform">✕</button>
          </div>
        )}

        {/* Timer Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-100">
          <div className="text-center space-y-6">
            {/* Timer Display */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white px-8 py-8 rounded-2xl shadow-2xl">
                <div className="text-5xl sm:text-7xl font-bold font-mono tracking-wider">
                  {formatElapsedTime(elapsedTime)}
                </div>
                {isRunning && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-2xl">{currentType === 'work' ? '💼' : '☕'}</span>
                    <span className="font-semibold text-lg">
                      {currentType === 'work' ? 'Werk Actief' : 'Pauze Actief'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="grid grid-cols-2 gap-4">
              {!isRunning ? (
                <button
                  onClick={() => startTimer('work')}
                  className="col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 text-lg"
                >
                  <span className="text-2xl">▶️</span>
                  <span>Start Werk</span>
                </button>
              ) : currentType === 'work' ? (
                <>
                  <button
                    onClick={stopTimer}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">⏹️</span>
                    <span>Stop</span>
                  </button>
                  <button
                    onClick={() => {
                      stopTimer();
                      setTimeout(() => startTimer('break'), 300);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">☕</span>
                    <span>Pauze</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={stopTimer}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">⏹️</span>
                    <span>Stop</span>
                  </button>
                  <button
                    onClick={() => {
                      stopTimer();
                      setTimeout(() => startTimer('work'), 300);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">▶️</span>
                    <span>Hervat</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Log Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">📝</span>
            <span>{editing ? 'Log Bewerken' : 'Uren Loggen'}</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Starttijd</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Eindtijd</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white"
                >
                  <option value="work">💼 Werk</option>
                  <option value="break">☕ Pauze</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-xl">{editing ? '✓' : '💾'}</span>
                <span>{editing ? 'Bijwerken' : 'Opslaan'}</span>
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all duration-200"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="text-3xl">📊</span>
            <span>14-Dagen Overzicht</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-indigo-100">
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-600">Datum</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-600">Totaal</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-600">Overwerk</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary, index) => (
                  <tr key={summary.date} className={`border-b border-gray-100 hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{summary.date}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{summary.totalHours}u</td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {(summary.overwork as any) > 0 ? `${summary.overwork}u` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-indigo-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-3xl">📅</span>
              <span>Kalender</span>
            </h2>
            <button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-xl">📊</span>
              <span>Export Excel</span>
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-100">
            <Calendar
              onClickDay={setSelectedDate}
              value={selectedDate}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const hours = getHoursForDate(date);
                  return hours !== '0.0' ? (
                    <div className="mt-1 text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      {hours}u
                    </div>
                  ) : null;
                }
                return null;
              }}
              className="w-full border-0"
            />
          </div>

          {selectedDate && (
            <div className="mt-6 space-y-3">
              <h3 className="text-lg font-bold text-gray-900">
                Logs - {format(selectedDate, 'dd-MM-yyyy')}
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs
                  .filter(log => log.date === format(selectedDate, 'yyyy-MM-dd'))
                  .map(log => (
                    <div
                      key={log.id}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:shadow-lg transition-all duration-200"
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-lg">
                          {log.startTime} - {log.endTime || '-'}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="text-lg">{log.type === 'work' ? '💼' : '☕'}</span>
                          <span>{log.type === 'work' ? 'Werk' : 'Pauze'}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => editLog(log)}
                          className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span>✏️</span>
                          <span>Bewerk</span>
                        </button>
                        <button
                          onClick={() => deleteLog(log.id)}
                          className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>Verwijder</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
