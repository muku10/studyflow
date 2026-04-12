import { NavLink } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import {
  LayoutDashboard, BookOpen, BrainCircuit, CheckCircle2,
  Timer, LogOut, GraduationCap, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/study-plan', icon: BrainCircuit, label: 'Study Plan' },
  { to: '/progress', icon: CheckCircle2, label: 'Progress' },
  { to: '/timer', icon: Timer, label: 'Focus Timer' },
];

export default function Sidebar() {
  const { user, logout } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const nav = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">StudyFlow</span>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">AI Study Planner</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMobileOpen(false)}>
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200/80 mx-3">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
            {user?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user}</p>
            <p className="text-[11px] text-slate-400">Free Plan</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all w-full">
          <LogOut className="w-[18px] h-[18px]" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-xl shadow-lg border border-slate-200">
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setMobileOpen(false)} />}

      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/80 flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setMobileOpen(false)} className="absolute top-5 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        {nav}
      </aside>

      <aside className="hidden lg:flex w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/80 flex-col fixed inset-y-0 left-0">
        {nav}
      </aside>
    </>
  );
}
