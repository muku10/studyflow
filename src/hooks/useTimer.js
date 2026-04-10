import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(initialMinutes = 25) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' or 'break'
  const intervalRef = useRef(null);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clear();
      setIsRunning(false);
    }
    return clear;
  }, [isRunning, timeLeft, clear]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => {
    setIsRunning(false);
    clear();
  }, [clear]);

  const reset = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      setTimeLeft((minutes ?? (mode === 'focus' ? 25 : 5)) * 60);
    },
    [clear, mode]
  );

  const switchMode = useCallback(
    (newMode) => {
      clear();
      setIsRunning(false);
      setMode(newMode);
      setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    },
    [clear]
  );

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return {
    minutes,
    seconds,
    timeLeft,
    isRunning,
    mode,
    start,
    pause,
    reset,
    switchMode,
    isFinished: timeLeft === 0,
  };
}
