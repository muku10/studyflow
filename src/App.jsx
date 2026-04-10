import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import StudyPlan from './pages/StudyPlan';
import Progress from './pages/Progress';
import FocusTimer from './pages/FocusTimer';

function ProtectedRoutes() {
  const { user } = useUser();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="study-plan" element={<StudyPlan />} />
        <Route path="progress" element={<Progress />} />
        <Route path="timer" element={<FocusTimer />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  const { user } = useUser();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}
