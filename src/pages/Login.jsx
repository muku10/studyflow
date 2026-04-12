import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { GraduationCap, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';

const TABS = { LOGIN: 'login', REGISTER: 'register', RESET: 'reset' };

function PasswordField({ value, onChange, placeholder, id, show, onToggle }) {
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
      <button type="button" onClick={onToggle} tabIndex={-1}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function Login() {
  const { login, register, reset } = useUser();
  const [tab, setTab] = useState(TABS.LOGIN);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registered, setRegistered] = useState(false);

  const clearForm = () => { setUsername(''); setPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); setRegistered(false); };
  const switchTab = (t) => { setTab(t); clearForm(); };

  const handleLogin = (e) => {
    e.preventDefault(); setError('');
    if (!username.trim() || !password) return setError('Please fill in all fields');
    const r = login(username.trim(), password);
    if (!r.success) setError(r.error);
  };

  const handleRegister = (e) => {
    e.preventDefault(); setError('');
    if (!username.trim() || !password) return setError('Please fill in all fields');
    if (username.trim().length < 3) return setError('Username must be at least 3 characters');
    if (password.length < 4) return setError('Password must be at least 4 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    const r = register(username.trim(), password);
    if (r.success) setRegistered(true); else setError(r.error);
  };

  const handleReset = (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!username.trim() || !password) return setError('Please fill in all fields');
    if (password.length < 4) return setError('Password must be at least 4 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    const r = reset(username.trim(), password);
    if (r.success) setSuccess('Password reset successful!'); else setError(r.error);
  };

  const cfg = {
    [TABS.LOGIN]: { title: 'Welcome back', sub: 'Sign in to continue your study plan', btn: 'Sign In', fn: handleLogin },
    [TABS.REGISTER]: { title: 'Create account', sub: 'Start your learning journey', btn: 'Create Account', fn: handleRegister },
    [TABS.RESET]: { title: 'Reset password', sub: 'Enter username and new password', btn: 'Reset Password', fn: handleReset },
  };
  const cur = cfg[tab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">StudyFlow</h1>
          <p className="text-slate-500 mt-1.5 text-sm">AI-powered study planner</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[{ key: TABS.LOGIN, label: 'Sign In' }, { key: TABS.REGISTER, label: 'Register' }, { key: TABS.RESET, label: 'Reset' }].map((t) => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-all ${tab === t.key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-7">
            {tab === TABS.REGISTER && registered ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Thank you for registering!</h2>
                <p className="text-sm text-slate-500 mb-6">Your account has been created. Please sign in to continue.</p>
                <button onClick={() => switchTab(TABS.LOGIN)} className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                  Go to Sign In &rarr;
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900 mb-1">{cur.title}</h2>
                <p className="text-sm text-slate-500 mb-6">{cur.sub}</p>

                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                    {success}
                    <button onClick={() => switchTab(TABS.LOGIN)} className="block mt-1 font-semibold hover:underline">Go to Sign In &rarr;</button>
                  </div>
                )}

                <form onSubmit={cur.fn} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                    <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. john_doe" autoFocus
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">{tab === TABS.RESET ? 'New Password' : 'Password'}</label>
                    <PasswordField id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                  </div>
                  {(tab === TABS.REGISTER || tab === TABS.RESET) && (
                    <div>
                      <label htmlFor="confirm" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                      <PasswordField id="confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" show={showPassword} onToggle={() => setShowPassword((v) => !v)} />
                    </div>
                  )}
                  <Button type="submit" className="w-full py-3">{cur.btn}</Button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-500">
                  {tab === TABS.LOGIN && <>Don't have an account? <button onClick={() => switchTab(TABS.REGISTER)} className="text-indigo-600 font-medium">Register</button></>}
                  {tab === TABS.REGISTER && <>Already have an account? <button onClick={() => switchTab(TABS.LOGIN)} className="text-indigo-600 font-medium">Sign In</button></>}
                  {tab === TABS.RESET && <>Remember your password? <button onClick={() => switchTab(TABS.LOGIN)} className="text-indigo-600 font-medium">Sign In</button></>}
                </p>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">All data is stored locally in your browser</p>
      </div>
    </div>
  );
}
