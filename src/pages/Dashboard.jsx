import { useUser } from '../context/UserContext';
import { getSubjects, getStudyPlan, getProgress } from '../utils/storage';
import { Link } from 'react-router-dom';
import Card, { CardBody } from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Timer,
  AlertTriangle,
  ArrowRight,
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

  // Upcoming deadlines (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingDeadlines = subjects
    .filter((s) => {
      const d = new Date(s.deadline);
      return d >= new Date() && d <= nextWeek;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const stats = [
    {
      label: 'Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      link: '/subjects',
    },
    {
      label: 'Plan Days',
      value: plan.length,
      icon: BrainCircuit,
      color: 'bg-purple-50 text-purple-600',
      link: '/study-plan',
    },
    {
      label: 'Today\'s Tasks',
      value: `${completedToday}/${todayTasks.length}`,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      link: '/progress',
    },
    {
      label: 'Focus Timer',
      value: '25 min',
      icon: Timer,
      color: 'bg-orange-50 text-orange-600',
      link: '/timer',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user}
        </h1>
        <p className="text-gray-500 mt-1">Here's your study overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow">
              <CardBody>
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Today's Tasks</h2>
            <Link to="/progress" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <CardBody>
            {todayTasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No tasks for today</p>
                <Link to="/study-plan" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
                  Generate a study plan
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <ProgressBar value={completedToday} max={todayTasks.length} className="mb-4" />
                {todayTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 py-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.priority === 'high'
                          ? 'bg-red-500'
                          : task.priority === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${progress[task.id] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.subjectTitle}
                      </p>
                      <p className="text-xs text-gray-500">{task.taskType} · {task.duration} min</p>
                    </div>
                    {progress[task.id] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
          </div>
          <CardBody>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No upcoming deadlines</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((subject) => {
                  const daysLeft = Math.ceil(
                    (new Date(subject.deadline) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={subject.id} className="flex items-center gap-3 py-2">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          daysLeft <= 2
                            ? 'bg-red-50 text-red-600'
                            : 'bg-yellow-50 text-yellow-600'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{subject.title}</p>
                        <p className="text-xs text-gray-500">
                          {daysLeft <= 0 ? 'Due today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          subject.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : subject.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
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
