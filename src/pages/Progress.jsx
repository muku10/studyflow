import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getStudyPlan, getProgress, saveProgress, getSubjects, getRecycleBin } from '../utils/storage';
import Card, { CardBody } from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import {
  CheckCircle2,
  Circle,
  Calendar,
  TrendingUp,
  BookOpen,
  Target,
} from 'lucide-react';

const priorityBadge = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function Progress() {
  const { userKey } = useUser();
  const rawPlan = getStudyPlan(userKey);
  const subjects = getSubjects(userKey);
  const [progress, setProgress] = useState(() => getProgress(userKey));

  const today = new Date().toISOString().split('T')[0];

  // Filter out recycled/deleted subjects from plan
  const recycledIds = new Set(getRecycleBin(userKey).map((s) => s.id));
  const activeSubjectIds = new Set(subjects.map((s) => s.id));
  const plan = rawPlan.map((day) => ({
    ...day,
    tasks: day.tasks.filter((t) => activeSubjectIds.has(t.subjectId) && !recycledIds.has(t.subjectId)),
  })).filter((day) => day.tasks.length > 0);

  const toggleTask = (taskId) => {
    const updated = { ...progress, [taskId]: !progress[taskId] };
    setProgress(updated);
    saveProgress(userKey, updated);
  };

  const allTasks = plan.flatMap((d) => d.tasks);
  const totalCompleted = allTasks.filter((t) => progress[t.id]).length;

  const todayPlan = plan.find((d) => d.date === today);
  const futureDays = plan.filter((d) => d.date > today);
  const pastDays = plan.filter((d) => d.date < today);

  // ── Subject-wise progress ──
  const subjectStats = subjects.map((subject) => {
    const tasks = allTasks.filter((t) => t.subjectId === subject.id);
    const completed = tasks.filter((t) => progress[t.id]).length;
    const totalMinutes = tasks.reduce((sum, t) => sum + t.duration, 0);
    const completedMinutes = tasks
      .filter((t) => progress[t.id])
      .reduce((sum, t) => sum + t.duration, 0);
    const daysLeft = Math.ceil(
      (new Date(subject.deadline) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return {
      ...subject,
      totalTasks: tasks.length,
      completedTasks: completed,
      totalMinutes,
      completedMinutes,
      daysLeft,
    };
  }).filter((s) => s.totalTasks > 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Progress Tracker</h1>
        <p className="text-gray-500 mt-1">Track your study progress overall and by subject</p>
      </div>

      {/* Overall Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCompleted}/{allTasks.length}</p>
                <p className="text-xs text-gray-500">Total Completed</p>
              </div>
            </div>
            <ProgressBar value={totalCompleted} max={allTasks.length} className="mt-3" />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {todayPlan ? todayPlan.tasks.filter((t) => progress[t.id]).length : 0}/{todayPlan?.tasks.length || 0}
                </p>
                <p className="text-xs text-gray-500">Today's Progress</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{futureDays.length}</p>
                <p className="text-xs text-gray-500">Days Remaining</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Subject-wise Progress */}
      {subjectStats.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Progress by Subject</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {subjectStats.map((subject) => {
              const percent = subject.totalTasks > 0
                ? Math.round((subject.completedTasks / subject.totalTasks) * 100)
                : 0;
              return (
                <Card key={subject.id}>
                  <CardBody>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-semibold text-gray-900">{subject.title}</h3>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityBadge[subject.priority]}`}>
                        {subject.priority}
                      </span>
                    </div>

                    {subject.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-1">{subject.description}</p>
                    )}

                    <ProgressBar value={subject.completedTasks} max={subject.totalTasks} className="mb-3" />

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{subject.completedTasks}/{subject.totalTasks} tasks done</span>
                      <span>{subject.completedMinutes}/{subject.totalMinutes} min studied</span>
                      <span className={subject.daysLeft <= 3 ? 'text-red-600 font-medium' : ''}>
                        {subject.daysLeft <= 0 ? 'Deadline passed' : `${subject.daysLeft}d left`}
                      </span>
                    </div>

                    {/* Completion status */}
                    {percent === 100 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 rounded-md px-2 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All tasks completed!
                      </div>
                    )}
                    {percent < 50 && subject.daysLeft <= 3 && subject.daysLeft > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-red-700 bg-red-50 rounded-md px-2 py-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Deadline approaching — less than 50% done
                      </div>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Task List */}
      {plan.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No study plan yet</h3>
            <p className="text-gray-500 text-sm">Generate a study plan first to start tracking</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Daily Tasks</h2>
          </div>

          {todayPlan && (
            <DaySection day={todayPlan} progress={progress} onToggle={toggleTask} isToday />
          )}

          {futureDays.map((day) => (
            <DaySection key={day.date} day={day} progress={progress} onToggle={toggleTask} />
          ))}

          {pastDays.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 mb-4">
                Past days ({pastDays.length})
              </summary>
              <div className="space-y-6">
                {[...pastDays].reverse().map((day) => (
                  <DaySection key={day.date} day={day} progress={progress} onToggle={toggleTask} isPast />
                ))}
              </div>
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
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="font-medium text-gray-900">{day.dayLabel}</span>
        {isToday && (
          <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Today</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {completed}/{day.tasks.length} done
        </span>
      </div>
      <CardBody>
        <ProgressBar value={completed} max={day.tasks.length} className="mb-4" />
        <div className="space-y-2">
          {day.tasks.map((task) => {
            const done = progress[task.id];
            return (
              <button
                key={task.id}
                onClick={() => onToggle(task.id)}
                className="flex items-center gap-3 p-3 rounded-lg w-full text-left hover:bg-gray-50 transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.subjectTitle}
                  </p>
                  <p className="text-xs text-gray-500">{task.taskType} · {task.duration} min</p>
                </div>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
