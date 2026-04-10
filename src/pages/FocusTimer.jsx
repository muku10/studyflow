import { useTimer } from '../hooks/useTimer';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

export default function FocusTimer() {
  const { minutes, seconds, isRunning, mode, start, pause, reset, switchMode, isFinished } =
    useTimer(25);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  const elapsed = totalSeconds - (minutes * 60 + seconds);
  const progress = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const offset = circumference - progress * circumference;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Focus Timer</h1>
        <p className="text-gray-500 mt-1">Pomodoro technique: 25 min focus, 5 min break</p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'focus' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Brain className="w-4 h-4" /> Focus
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
              mode === 'break' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Coffee className="w-4 h-4" /> Break
          </button>
        </div>

        <Card>
          <CardBody className="flex flex-col items-center py-10">
            {/* Circular Timer */}
            <div className="relative w-64 h-64 mb-8">
              <svg className="w-64 h-64 -rotate-90" viewBox="0 0 264 264">
                <circle
                  cx="132"
                  cy="132"
                  r={radius}
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                />
                <circle
                  cx="132"
                  cy="132"
                  r={radius}
                  fill="none"
                  stroke={mode === 'focus' ? '#4f46e5' : '#16a34a'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-gray-900 tabular-nums">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
                <span className="text-sm text-gray-500 mt-1 capitalize">{mode} mode</span>
              </div>
            </div>

            {/* Finished Message */}
            {isFinished && (
              <div className={`mb-6 px-4 py-2 rounded-lg text-sm font-medium ${
                mode === 'focus' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
              }`}>
                {mode === 'focus' ? 'Great work! Time for a break.' : 'Break over! Ready to focus?'}
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <Button onClick={start} disabled={isFinished} size="lg">
                  <Play className="w-5 h-5" /> Start
                </Button>
              ) : (
                <Button onClick={pause} variant="secondary" size="lg">
                  <Pause className="w-5 h-5" /> Pause
                </Button>
              )}
              <Button onClick={() => reset()} variant="ghost" size="lg">
                <RotateCcw className="w-5 h-5" /> Reset
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tips */}
        <Card className="mt-6">
          <CardBody>
            <h3 className="font-medium text-gray-900 text-sm mb-3">Pomodoro Tips</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">1.</span>
                Focus for 25 minutes without distractions
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">2.</span>
                Take a 5-minute break to recharge
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-500 font-bold">3.</span>
                After 4 sessions, take a longer 15-30 min break
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
