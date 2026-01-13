import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, differenceInMinutes } from 'date-fns';
import * as XLSX from 'xlsx';
import Calendar from 'react-calendar';
import { Button, Card, Input, PageLayout, Alert } from './ui';
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
    <PageLayout
      title="Werkuren Logger"
      header={true}
      headerAction={
        <Button 
          variant="secondary"
          size="md"
          onClick={handleLogout}
          icon="🚪"
        >
          Uitloggen
        </Button>
      }
    >
      {feedback && (
        <div className="mb-6">
          <Alert
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Timer Section */}
      <Card variant="elevated" className="p-4 sm:p-8 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
          <span>⏱️</span> Timer
        </h2>

        <div className="mb-6 sm:mb-8 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-8 py-4 sm:py-6 rounded-lg sm:rounded-xl inline-block shadow-lg">
            <span className="text-3xl sm:text-5xl font-mono font-bold font-sans">
              {formatElapsedTime(elapsedTime)}
            </span>
          </div>
          {isRunning && (
            <div className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-blue-600 bg-blue-50 px-3 sm:px-4 py-2 rounded-lg inline-block">
              {currentType === 'work' ? '💼 Werk actief' : '☕ Pauze actief'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isRunning ? (
            <Button 
              variant="success"
              size="lg"
              onClick={() => startTimer('work')}
              icon="▶️"
              fullWidth
              className="col-span-1 sm:col-span-2"
            >
              Start Werk
            </Button>
          ) : currentType === 'work' ? (
            <>
              <Button 
                variant="danger"
                size="lg"
                onClick={stopTimer}
                icon="⏹️"
                fullWidth
              >
                Stop
              </Button>
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => {
                  stopTimer();
                  setTimeout(() => startTimer('break'), 300);
                }}
                icon="☕"
                fullWidth
              >
                Pauze
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="danger"
                size="lg"
                onClick={stopTimer}
                icon="⏹️"
                fullWidth
              >
                Stop
              </Button>
              <Button 
                variant="success"
                size="lg"
                onClick={() => {
                  stopTimer();
                  setTimeout(() => startTimer('work'), 300);
                }}
                icon="▶️"
                fullWidth
              >
                Hervat
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Form Section */}
      <Card variant="elevated" className="p-4 sm:p-8 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
          <span>📝</span> {editing ? 'Log Bewerken' : 'Uren Loggen'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <Input
              label="Datum"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Input
              label="Starttijd"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="Eindtijd (optioneel)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 text-base rounded-lg border-2 border-slate-200 bg-white focus:border-blue-500 focus:outline-none transition-all"
              >
                <option value="work">💼 Werk</option>
                <option value="break">☕ Pauze</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={editing ? "✓" : "💾"}
              fullWidth
            >
              {editing ? 'Bijwerken' : 'Opslaan'}
            </Button>
            {editing && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setEditing(null)}
                icon="✕"
                fullWidth
              >
                Annuleren
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Summary Section */}
      <Card variant="elevated" className="p-4 sm:p-8 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
          <span>📊</span> Overzicht
        </h2>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700">Datum</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700">Totaal</th>
                <th className="text-left px-3 sm:px-4 py-2 sm:py-3 font-semibold text-slate-700">Overwerk</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(summary => (
                <tr key={summary.date} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-slate-900 font-medium">{summary.date}</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-blue-600 font-semibold">{summary.totalHours}u</td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 text-red-600 font-semibold">
                    {(summary.overwork as any) > 0 ? `${summary.overwork}u` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Calendar Section */}
      <Card variant="elevated" className="p-4 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span>📅</span> Kalender
          </h2>
          <Button
            variant="success"
            onClick={exportToExcel}
            icon="📊"
            size="md"
            fullWidth={false}
          >
            Export
          </Button>
        </div>

        <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm border border-slate-200 overflow-x-auto">
          <Calendar
            onClickDay={setSelectedDate}
            value={selectedDate}
            tileContent={({ date, view }) => {
              if (view === 'month') {
                const hours = getHoursForDate(date);
                return hours !== '0.0' ? (
                  <p className="text-xs sm:text-sm font-bold text-blue-600 mt-0.5 sm:mt-1">{hours}u</p>
                ) : null;
              }
              return null;
            }}
            className="w-full text-xs sm:text-sm"
            tileClassName="h-16 sm:h-24 flex flex-col items-center justify-center hover:bg-blue-50 rounded transition-colors"
          />
        </div>

        {selectedDate && (
          <div className="mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
              Logs voor {format(selectedDate, 'dd-MM-yyyy')}
            </h3>
            <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
              {logs
                .filter(log => log.date === format(selectedDate, 'yyyy-MM-dd'))
                .map(log => (
                  <div
                    key={log.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">
                        {log.startTime} - {log.endTime || '-'}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        {log.type === 'work' ? '💼 Werk' : '☕ Pauze'}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => editLog(log)}
                        icon="✏️"
                        fullWidth
                        className="sm:w-auto"
                      >
                        Bewerk
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteLog(log.id)}
                        icon="🗑️"
                        fullWidth
                        className="sm:w-auto"
                      >
                        Verwijder
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Card>
    </PageLayout>
  );
};

export default Dashboard;
