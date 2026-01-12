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
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 px-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Werkuren Logger</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-6 py-3 rounded text-lg min-h-[56px]">Uitloggen</button>
        </header>
        <div className="bg-gray-50 p-6 sm:p-8 rounded shadow-md mb-8">
          <h2 className="text-2xl mb-6">Timer</h2>
          <div className="mb-6">
            <label className="block text-lg font-medium mb-3">Type</label>
            <select value={currentType} onChange={(e) => setCurrentType(e.target.value)} className="w-full p-4 border rounded text-lg min-h-[56px]">
              <option value="work">Werk</option>
              <option value="break">Pauze</option>
            </select>
          </div>
          <div className="mb-6 text-center">
            <span className="text-3xl font-mono">{formatElapsedTime(elapsedTime)}</span>
            {isRunning && <span className="ml-2 text-lg">({currentType === 'work' ? 'Werk' : 'Pauze'})</span>}
          </div>
          <div className="flex flex-col gap-4">
            {!isRunning ? (
              <button onClick={() => startTimer('work')} className="bg-green-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Start Werk</button>
            ) : currentType === 'work' ? (
              <>
                <button onClick={stopTimer} className="bg-red-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Stop</button>
                <button onClick={startBreak} className="bg-yellow-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Pauze</button>
              </>
            ) : (
              <>
                <button onClick={stopTimer} className="bg-red-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Stop</button>
                <button onClick={startWork} className="bg-green-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Start Werk</button>
              </>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 sm:p-8 rounded shadow-md mb-8">
          <h2 className="text-2xl mb-6">{editing ? 'Log Bewerken' : 'Uren Loggen'}</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-lg font-medium mb-3">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 border rounded text-lg min-h-[56px]"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-medium mb-3">Starttijd</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-4 border rounded text-lg min-h-[56px]"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-medium mb-3">Eindtijd (optioneel)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-4 border rounded text-lg min-h-[56px]"
              />
            </div>
            <div>
              <label className="block text-lg font-medium mb-3">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-4 border rounded text-lg min-h-[56px]">
                <option value="work">Werk</option>
                <option value="break">Pauze</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4">
            <button type="submit" className="bg-blue-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">
              {editing ? 'Bijwerken' : 'Log'}
            </button>
            {editing && <button type="button" onClick={() => setEditing(null)} className="bg-gray-500 text-white px-6 py-4 rounded text-xl min-h-[64px]">Annuleren</button>}
          </div>
        </form>
        <div className="bg-gray-50 p-6 sm:p-8 rounded shadow-md mb-8">
          <h2 className="text-2xl mb-6">Dagelijkse Samenvatting</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[400px] text-lg">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Datum</th>
                  <th className="text-left p-3">Totaal Uren</th>
                  <th className="text-left p-3">Overwerk Uren</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(summary => (
                  <tr key={summary.date} className="border-b">
                    <td className="p-3">{summary.date}</td>
                    <td className="p-3">{summary.totalHours}u</td>
                    <td className="p-3">{summary.overwork > 0 ? `${summary.overwork}u` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 p-6 sm:p-8 rounded shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl">Kalender</h2>
            <button onClick={exportToExcel} className="bg-green-500 text-white px-6 py-4 rounded text-xl min-h-[64px] w-full sm:w-auto">Exporteren naar Excel</button>
          </div>
          <div className="mb-6">
            <Calendar
              onClickDay={setSelectedDate}
              value={selectedDate}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const hours = getHoursForDate(date);
                  return hours !== '0.0' ? <p className="text-sm text-center font-semibold">{hours}u</p> : null;
                }
                return null;
              }}
              className="w-full text-lg"
              tileClassName="min-h-[60px] flex items-center justify-center"
            />
          </div>
          {selectedDate && (
            <div>
              <h3 className="text-xl mb-4">Logs voor {format(selectedDate, 'dd-MM-yyyy')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-[600px] text-lg">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Start</th>
                      <th className="text-left p-3">Eind</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(log => log.date === format(selectedDate, 'yyyy-MM-dd')).map(log => (
                      <tr key={log.id} className="border-b">
                        <td className="p-3">{log.startTime}</td>
                        <td className="p-3">{log.endTime || '-'}</td>
                        <td className="p-3">{log.type}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            <button onClick={() => editLog(log)} className="bg-blue-500 text-white px-4 py-3 rounded text-lg min-h-[56px]">Bewerken</button>
                            <button onClick={() => deleteLog(log.id)} className="bg-red-500 text-white px-4 py-3 rounded text-lg min-h-[56px]">Verwijderen</button>
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