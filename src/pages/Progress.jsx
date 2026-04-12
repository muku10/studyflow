import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getStudyPlan, getProgress, saveProgress, getSubjects, getRecycleBin } from '../utils/storage';
import Card, { CardBody } from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import { CheckCircle2, Circle, Calendar, TrendingUp, BookOpen, Target } from 'lucide-react';

const priorityBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };

export default function Progress() {
  const { userKey } = useUser();
  const rawPlan = getStudyPlan(userKey);
  const subjects = getSubjects(userKey);
  const [progress, setProgress] = useState(() => getProgress(userKey));

  const today = new Date().toISOString().split('T')[0];
  const recycledIds = new Set(getRecycleBin(userKey).map((s) => s.id));
  const activeIds = new Set(subjects.map((s) => s.id));

  // Filter out recycled/deleted subjects
  const plan = rawPlan.map((d) => ({
    ...d, tasks: d.tasks.filter((t) => activeIds.has(t.subjectId) && !recycledIds.has(t.subjectId)),
  })).filter((d) => d.tasks.length > 0);

  const toggleTask = (taskId) => {
    const updated = { ...progress, [taskId]: !progress[taskId] };
    setProgress(updated);
    saveProgress(userKey, updated);
  };

  const allTasks = plan.flatMap((d) => d.tasks);
  const totalCompleted = allTasks.filter((t) => progress[t.id]).length;
  const todayPlan = plan.find((d) => d.date === today);
  const futureDays = plan.filter((d) => d.date >= today);
  const pastDays = plan.filter((d) => d.date < today);

  const subjectStats = subjects.map((s) => {
    const tasks = allTasks.filter((t) => t.subjectId === s.id);
    const completed = tasks.filter((t) => progress[t.id]).length;
    const totalMin = tasks.reduce((sum, t) => sum + t.duration, 0);
    const doneMin = tasks.filter((t) => progress[t.id]).reduce((sum, t) => sum + t.duration, 0);
    const daysLeft = Math.ceil((new Date(s.deadline) - new Date()) / 86400000);
    return { ...s, totalTasks: tasks.length, completedTasks: completed, totalMin, doneMin, daysLeft };
  }).filter((s) => s.totalTasks > 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Progress Tracker</h1>
        <p className="text-slate-500 mt-1">Track your study progress by subject and day</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
              <div><p className="text-2xl font-bold text-slate-900">{totalCompleted}/{allTasks.length}</p><p className="text-xs text-slate-500">Total Completed</p></div>
            </div>
            <ProgressBar value={totalCompleted} max={allTasks.length} className="mt-3" />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{todayPlan ? todayPlan.tasks.filter((t) => progress[t.id]).length : 0}/{todayPlan?.tasks.length || 0}</p>
                <p className="text-xs text-slate-500">Today's Progress</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              <div><p className="text-2xl font-bold text-slate-900">{futureDays.length}</p><p className="text-xs text-slate-500">Days Remaining</p></div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise */}
      {subjectStats.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-slate-400" /><h2 className="text-lg font-semibold text-slate-900">By Subject</h2></div>
          <div className="grid sm:grid-cols-2 gap-4">
            {subjectStats.map((s) => {
              const pct = s.totalTasks > 0 ? Math.round((s.completedTasks / s.totalTasks) * 100) : 0;
              return (
                <Card key={s.id}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /><h3 className="text-sm font-semibold text-slate-900">{s.title}</h3></div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityBadge[s.priority]}`}>{s.priority}</span>
                    </div>
                    <ProgressBar value={s.completedTasks} max={s.totalTasks} className="mb-3" />
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{s.completedTasks}/{s.totalTasks} tasks</span>
                      <span>{s.doneMin}/{s.totalMin} min</span>
                      <span className={s.daysLeft <= 3 ? 'text-red-600 font-medium' : ''}>{s.daysLeft <= 0 ? 'Overdue' : `${s.daysLeft}d left`}</span>
                    </div>
                    {pct === 100 && <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5"><CheckCircle2 className="w-3.5 h-3.5" />Completed!</div>}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily tasks */}
      {plan.length === 0 ? (
        <Card><CardBody className="text-center py-16"><CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" /><h3 className="text-lg font-medium text-slate-900 mb-1">No study plan yet</h3><p className="text-slate-500 text-sm">Generate a study plan first</p></CardBody></Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-slate-400" /><h2 className="text-lg font-semibold text-slate-900">Daily Tasks</h2></div>
          {futureDays.map((day) => <DaySection key={day.date} day={day} progress={progress} onToggle={toggleTask} isToday={day.date === today} />)}
          {pastDays.length > 0 && (
            <details><summary className="cursor-pointer text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">Past days ({pastDays.length})</summary>
              <div className="space-y-6">{[...pastDays].reverse().map((day) => <DaySection key={day.date} day={day} progress={progress} onToggle={toggleTask} isPast />)}</div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function DaySection({ day, progress, onToggle, isToday, isPast }) {
  const completed = day.tasks.filter((t) => progress[t.id]).length;
  return (
    <Card className={isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : isPast ? 'opacity-60' : ''}>
      <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-900">{day.dayLabel}</span>
        {isToday && <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Today</span>}
        <span className="text-xs text-slate-400 ml-auto">{completed}/{day.tasks.length} done</span>
      </div>
      <CardBody>
        <ProgressBar value={completed} max={day.tasks.length} className="mb-4" />
        <div className="space-y-1">
          {day.tasks.map((task) => {
            const done = progress[task.id];
            return (
              <button key={task.id} onClick={() => onToggle(task.id)}
                className="flex items-center gap-3 p-3 rounded-xl w-full text-left hover:bg-slate-50 transition-all">
                {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-slate-300 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.subjectTitle}</p>
                  <p className="text-xs text-slate-500">{task.taskType} · {task.duration} min</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
