import { useTimer } from '../hooks/useTimer';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

export default function FocusTimer() {
  const { minutes, seconds, isRunning, mode, start, pause, reset, switchMode, isFinished } = useTimer(25);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const elapsed = totalSeconds - (minutes * 60 + seconds);
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const offset = circumference - progress * circumference;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Focus Timer</h1>
        <p className="text-slate-500 mt-1">Pomodoro technique: 25 min focus, 5 min break</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-8">
          <button onClick={() => switchMode('focus')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'focus' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Brain className="w-4 h-4" /> Focus
          </button>
          <button onClick={() => switchMode('break')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'break' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Coffee className="w-4 h-4" /> Break
          </button>
        </div>

        <Card>
          <CardBody className="flex flex-col items-center py-12">
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-64 h-64 -rotate-90" viewBox="0 0 264 264">
                <circle cx="132" cy="132" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="132" cy="132" r={radius} fill="none"
                  stroke={mode === 'focus' ? 'url(#focusGrad)' : 'url(#breakGrad)'}
                  strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-linear" />
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="breakGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900 tabular-nums tracking-tight">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-sm text-slate-400 mt-1 capitalize font-medium">{mode} mode</span>
              </div>
            </div>

            {isFinished && (
              <div className={`mb-6 px-5 py-2.5 rounded-xl text-sm font-medium ${mode === 'focus' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                {mode === 'focus' ? 'Great work! Time for a break.' : 'Break over! Ready to focus?'}
              </div>
            )}

            <div className="flex items-center gap-3">
              {!isRunning ? (
                <Button onClick={start} disabled={isFinished} size="lg"><Play className="w-5 h-5" /> Start</Button>
              ) : (
                <Button onClick={pause} variant="secondary" size="lg"><Pause className="w-5 h-5" /> Pause</Button>
              )}
              <Button onClick={() => reset()} variant="ghost" size="lg"><RotateCcw className="w-5 h-5" /> Reset</Button>
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardBody>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">How it works</h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">1</span>Focus for 25 minutes without distractions</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">2</span>Take a 5-minute break to recharge</li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">3</span>After 4 sessions, take a longer 15-30 min break</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
