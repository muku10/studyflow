const API = 'http://localhost:3001/api';

// ── In-memory cache (synced with JSON files via API) ──

let _data = null;
let _accounts = null;
let _loaded = false;

function getData() {
  if (!_data) _data = { users: {}, currentUser: null };
  return _data;
}

function saveData(data) {
  _data = data;
  // Async write to file — fire and forget
  fetch(`${API}/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {});
}

function getAccounts() {
  if (!_accounts) _accounts = {};
  return _accounts;
}

function saveAccounts(accounts) {
  _accounts = accounts;
  fetch(`${API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accounts),
  }).catch(() => {});
}

/**
 * Load data from JSON files on startup.
 * Call this once before the app renders.
 */
export async function initStorage() {
  if (_loaded) return;
  try {
    const [dataRes, accRes] = await Promise.all([
      fetch(`${API}/data`),
      fetch(`${API}/accounts`),
    ]);
    if (dataRes.ok) _data = await dataRes.json();
    if (accRes.ok) _accounts = await accRes.json();
    _loaded = true;
  } catch {
    // Server not running — fall back to empty data
    console.warn('API server not running. Start it with: npm run server');
    _data = { users: {}, currentUser: null };
    _accounts = {};
    _loaded = true;
  }
}

// ── Account / Auth system ──

export function registerUser(username, password) {
  const accounts = getAccounts();
  const key = username.toLowerCase();

  if (accounts[key]) {
    return { success: false, error: 'Username already exists' };
  }

  accounts[key] = {
    displayName: username,
    password,
    createdAt: new Date().toISOString(),
  };
  saveAccounts(accounts);

  const data = getData();
  if (!data.users[key]) {
    data.users[key] = { subjects: [], studyPlan: [], progress: {} };
    saveData(data);
  }

  return { success: true, displayName: username };
}

export function loginUser(username, password) {
  const accounts = getAccounts();
  const key = username.toLowerCase();
  const account = accounts[key];

  if (!account) {
    return { success: false, error: 'Account not found. Please register first.' };
  }

  if (account.password !== password) {
    return { success: false, error: 'Incorrect password' };
  }

  const data = getData();
  if (!data.users[key]) {
    data.users[key] = { subjects: [], studyPlan: [], progress: {} };
  }
  data.currentUser = key;
  saveData(data);

  return { success: true, displayName: account.displayName };
}

export function resetPassword(username, newPassword) {
  const accounts = getAccounts();
  const key = username.toLowerCase();
  const account = accounts[key];

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  accounts[key].password = newPassword;
  saveAccounts(accounts);

  return { success: true };
}

export function getCurrentUser() {
  const data = getData();
  if (!data.currentUser) return null;

  const accounts = getAccounts();
  const account = accounts[data.currentUser];
  return account ? account.displayName : data.currentUser;
}

export function getCurrentUserKey() {
  return getData().currentUser;
}

export function logout() {
  const data = getData();
  data.currentUser = null;
  saveData(data);
}

// ── User data ──

export function getUserData(username) {
  const data = getData();
  const key = username.toLowerCase();
  return data.users[key] || { subjects: [], studyPlan: [], progress: {} };
}

export function saveUserData(username, userData) {
  const data = getData();
  data.users[username.toLowerCase()] = userData;
  saveData(data);
}

export function getSubjects(username) {
  return getUserData(username).subjects || [];
}

export function saveSubjects(username, subjects) {
  const userData = getUserData(username);
  userData.subjects = subjects;
  saveUserData(username, userData);
}

export function getStudyPlan(username) {
  return getUserData(username).studyPlan || [];
}

export function saveStudyPlan(username, plan) {
  const userData = getUserData(username);
  userData.studyPlan = plan;
  saveUserData(username, userData);
}

export function getProgress(username) {
  return getUserData(username).progress || {};
}

export function saveProgress(username, progress) {
  const userData = getUserData(username);
  userData.progress = progress;
  saveUserData(username, userData);
}

// ── Recycle bin ──

export function getRecycleBin(username) {
  return getUserData(username).recycleBin || [];
}

export function recycleSubject(username, subjectId) {
  const userData = getUserData(username);
  const subject = (userData.subjects || []).find((s) => s.id === subjectId);
  if (!subject) return;

  if (!userData.recycleBin) userData.recycleBin = [];
  userData.recycleBin.push({ ...subject, deletedAt: new Date().toISOString() });
  userData.subjects = userData.subjects.filter((s) => s.id !== subjectId);

  saveUserData(username, userData);
}

export function restoreSubject(username, subjectId) {
  const userData = getUserData(username);
  const item = (userData.recycleBin || []).find((s) => s.id === subjectId);
  if (!item) return;

  const { deletedAt, ...subject } = item;
  userData.subjects = [...(userData.subjects || []), subject];
  userData.recycleBin = userData.recycleBin.filter((s) => s.id !== subjectId);

  saveUserData(username, userData);
}

export function permanentlyDeleteSubject(username, subjectId) {
  const userData = getUserData(username);

  userData.recycleBin = (userData.recycleBin || []).filter((s) => s.id !== subjectId);

  if (userData.studyPlan) {
    userData.studyPlan = userData.studyPlan
      .map((day) => ({ ...day, tasks: day.tasks.filter((t) => t.subjectId !== subjectId) }))
      .filter((day) => day.tasks.length > 0);
  }

  if (userData.progress) {
    const newProgress = {};
    for (const [key, val] of Object.entries(userData.progress)) {
      if (!key.startsWith(subjectId)) newProgress[key] = val;
    }
    userData.progress = newProgress;
  }

  saveUserData(username, userData);
}

export function deleteSubjectWithPlan(username, subjectId) {
  const userData = getUserData(username);
  userData.subjects = (userData.subjects || []).filter((s) => s.id !== subjectId);

  if (userData.studyPlan) {
    userData.studyPlan = userData.studyPlan
      .map((day) => ({ ...day, tasks: day.tasks.filter((t) => t.subjectId !== subjectId) }))
      .filter((day) => day.tasks.length > 0);
  }

  saveUserData(username, userData);
}
