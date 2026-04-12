import { useUser } from '../context/UserContext';
import { getSubjects, getStudyPlan, getProgress } from '../utils/storage';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import {
  BookOpen, BrainCircuit, CheckCircle2,
  AlertTriangle, ArrowRight, TrendingUp, Calendar,
} from 'lucide-react';

export default function Dashboard() {
  const { user, userKey } = useUser();
  const subjects = getSubjects(userKey);
  const plan = getStudyPlan(userKey);
  const progress = getProgress(userKey);

  const today = new Date().toISOString().split('T')[0];
  const todayPlan = plan.find((d) => d.date === today);
  const todayTasks = todayPlan?.tasks || [];
  const completedToday = todayTasks.filter((t) => progress[t.id]).length;
  const allTasks = plan.flatMap((d) => d.tasks);
  const totalCompleted = allTasks.filter((t) => progress[t.id]).length;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingDeadlines = subjects
    .filter((s) => { const d = new Date(s.deadline); return d >= new Date() && d <= nextWeek; })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{greeting}, {user}</h1>
        <p className="text-slate-500 mt-1">Here's your study overview for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Subjects', value: subjects.length, icon: BookOpen, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', link: '/subjects' },
          { label: 'Plan Days', value: plan.length, icon: BrainCircuit, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', link: '/study-plan' },
          { label: "Today's Tasks", value: `${completedToday}/${todayTasks.length}`, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', link: '/progress' },
          { label: 'Overall', value: allTasks.length > 0 ? `${Math.round((totalCompleted / allTasks.length) * 100)}%` : '0%', icon: TrendingUp, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', link: '/progress' },
        ].map((s) => (
          <Link key={s.label} to={s.link}>
            <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <CardBody>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Today's Tasks</h2>
            <Link to="/progress" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CardBody>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No tasks for today</p>
                <Link to="/study-plan" className="text-sm text-indigo-600 hover:underline mt-1 inline-block font-medium">Generate a study plan</Link>
              </div>
            ) : (
              <div className="space-y-3">
                <ProgressBar value={completedToday} max={todayTasks.length} className="mb-4" />
                {todayTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${progress[task.id] ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.subjectTitle}</p>
                      <p className="text-xs text-slate-500">{task.taskType} · {task.duration} min</p>
                    </div>
                    {progress[task.id] && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Deadlines */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Upcoming Deadlines</h2>
          </div>
          <CardBody>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No upcoming deadlines this week</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((subject) => {
                  const daysLeft = Math.ceil((new Date(subject.deadline) - new Date()) / 86400000);
                  return (
                    <div key={subject.id} className="flex items-center gap-3 py-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${daysLeft <= 2 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{subject.title}</p>
                        <p className="text-xs text-slate-500">{daysLeft <= 0 ? 'Due today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${subject.priority === 'high' ? 'bg-red-100 text-red-700' : subject.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {subject.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
