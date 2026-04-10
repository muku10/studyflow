import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { GraduationCap, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Button from '../components/ui/Button';

const TABS = {
  LOGIN: 'login',
  REGISTER: 'register',
  RESET: 'reset',
};

function PasswordInput({ value, onChange, placeholder, id, showPassword, onToggleShow }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 pr-11 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setRegistered(false);
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    clearForm();
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    const result = login(username.trim(), password);
    if (!result.success) setError(result.error);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const result = register(username.trim(), password);
    if (result.success) {
      setRegistered(true);
    } else {
      setError(result.error);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    const result = reset(username.trim(), password);
    if (result.success) {
      setSuccess('Password reset successful! You can now log in.');
    } else {
      setError(result.error);
    }
  };

  const tabConfig = {
    [TABS.LOGIN]: { title: 'Welcome back', subtitle: 'Sign in to your account', button: 'Sign In', handler: handleLogin },
    [TABS.REGISTER]: { title: 'Create account', subtitle: 'Get started with StudyFlow', button: 'Create Account', handler: handleRegister },
    [TABS.RESET]: { title: 'Reset password', subtitle: 'Enter your username and new password', button: 'Reset Password', handler: handleReset },
  };

  const current = tabConfig[tab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">StudyFlow</h1>
          <p className="text-gray-500 mt-2">AI-powered study planner</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          {/* Tab Switcher */}
          <div className="flex border-b border-gray-100">
            {[
              { key: TABS.LOGIN, label: 'Sign In' },
              { key: TABS.REGISTER, label: 'Register' },
              { key: TABS.RESET, label: 'Reset' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Registration success screen */}
            {tab === TABS.REGISTER && registered ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Thank you for registering!
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Your account has been created successfully. Please log in to continue.
                </p>
                <button
                  onClick={() => switchTab(TABS.LOGIN)}
                  className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                >
                  Go to Sign In &rarr;
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{current.title}</h2>
                <p className="text-sm text-gray-500 mb-6">{current.subtitle}</p>

                {/* Error / Success messages */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    {success}
                    <button
                      onClick={() => switchTab(TABS.LOGIN)}
                      className="block mt-2 text-green-800 font-semibold hover:underline"
                    >
                      Go to Sign In &rarr;
                    </button>
                  </div>
                )}

                <form onSubmit={current.handler} className="space-y-4">
                  {/* Username */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. john_doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      autoFocus
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {tab === TABS.RESET ? 'New Password' : 'Password'}
                    </label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      showPassword={showPassword}
                      onToggleShow={() => setShowPassword((v) => !v)}
                    />
                  </div>

                  {/* Confirm Password (Register + Reset only) */}
                  {(tab === TABS.REGISTER || tab === TABS.RESET) && (
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm {tab === TABS.RESET ? 'New ' : ''}Password
                      </label>
                      <PasswordInput
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        showPassword={showPassword}
                        onToggleShow={() => setShowPassword((v) => !v)}
                      />
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    {current.button}
                  </Button>
                </form>

                {/* Footer links */}
                <div className="mt-6 text-center text-sm text-gray-500">
                  {tab === TABS.LOGIN && (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => switchTab(TABS.REGISTER)} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Register
                      </button>
                    </>
                  )}
                  {tab === TABS.REGISTER && (
                    <>
                      Already have an account?{' '}
                      <button onClick={() => switchTab(TABS.LOGIN)} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Sign In
                      </button>
                    </>
                  )}
                  {tab === TABS.RESET && (
                    <>
                      Remember your password?{' '}
                      <button onClick={() => switchTab(TABS.LOGIN)} className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          All data is stored locally in your browser
        </p>
      </div>
    </div>
  );
}
