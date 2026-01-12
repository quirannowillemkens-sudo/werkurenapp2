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
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Werkuren Logger</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded min-h-[44px]">Uitloggen</button>
        </header>
        <div className="bg-gray-50 p-4 sm:p-6 rounded shadow-md mb-8">
          <h2 className="text-xl mb-4">Timer</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Type</label>
            <select value={currentType} onChange={(e) => setCurrentType(e.target.value)} className="w-full p-2 border rounded min-h-[44px]">
              <option value="work">Werk</option>
              <option value="break">Pauze</option>
            </select>
          </div>
          <div className="mb-4 text-center">
            <span className="text-2xl font-mono">{formatElapsedTime(elapsedTime)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {!isRunning ? (
              <button onClick={startTimer} className="bg-green-500 text-white px-4 py-2 rounded min-h-[44px] flex-1">Start</button>
            ) : (
              <button onClick={stopTimer} className="bg-red-500 text-white px-4 py-2 rounded min-h-[44px] flex-1">Stop</button>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 sm:p-6 rounded shadow-md mb-8">
          <h2 className="text-xl mb-4">{editing ? 'Log Bewerken' : 'Uren Loggen'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Starttijd</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border rounded min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Eindtijd (optioneel)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border rounded min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border rounded min-h-[44px]">
                <option value="work">Werk</option>
                <option value="break">Pauze</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded min-h-[44px] flex-1">
              {editing ? 'Bijwerken' : 'Log'}
            </button>
            {editing && <button type="button" onClick={() => setEditing(null)} className="bg-gray-500 text-white px-4 py-2 rounded min-h-[44px] flex-1">Annuleren</button>}
          </div>
        </form>
        <div className="bg-gray-50 p-4 sm:p-6 rounded shadow-md mb-8">
          <h2 className="text-xl mb-4">Dagelijkse Samenvatting</h2>
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[400px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Datum</th>
                  <th className="text-left p-2">Totaal Uren</th>
                  <th className="text-left p-2">Overwerk Uren</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(summary => (
                  <tr key={summary.date} className="border-b">
                    <td className="p-2">{summary.date}</td>
                    <td className="p-2">{summary.totalHours}u</td>
                    <td className="p-2">{summary.overwork > 0 ? `${summary.overwork}u` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 p-4 sm:p-6 rounded shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h2 className="text-xl">Kalender</h2>
            <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded min-h-[44px] w-full sm:w-auto">Exporteren naar Excel</button>
          </div>
          <div className="mb-4">
            <Calendar
              onClickDay={setSelectedDate}
              value={selectedDate}
              tileContent={({ date, view }) => {
                if (view === 'month') {
                  const hours = getHoursForDate(date);
                  return hours !== '0.0' ? <p className="text-xs text-center">{hours}u</p> : null;
                }
                return null;
              }}
              className="w-full"
            />
          </div>
          {selectedDate && (
            <div>
              <h3 className="text-lg mb-2">Logs voor {format(selectedDate, 'dd-MM-yyyy')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Start</th>
                      <th className="text-left p-2">Eind</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(log => log.date === format(selectedDate, 'yyyy-MM-dd')).map(log => (
                      <tr key={log.id} className="border-b">
                        <td className="p-2">{log.startTime}</td>
                        <td className="p-2">{log.endTime || '-'}</td>
                        <td className="p-2">{log.type}</td>
                        <td className="p-2">
                          <div className="flex flex-col sm:flex-row gap-1">
                            <button onClick={() => editLog(log)} className="text-blue-500 min-h-[44px]">Bewerken</button>
                            <button onClick={() => deleteLog(log.id)} className="text-red-500 min-h-[44px]">Verwijderen</button>
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