const STORAGE_KEY = 'studyflow_data';
const AUTH_KEY = 'studyflow_accounts';

function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { users: {}, currentUser: null };
  } catch { return { users: {}, currentUser: null }; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAccounts(accounts) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
}

// ── Auth ──

export function registerUser(username, password) {
  const accounts = getAccounts();
  const key = username.toLowerCase();
  if (accounts[key]) return { success: false, error: 'Username already exists' };

  accounts[key] = { displayName: username, password, createdAt: new Date().toISOString() };
  saveAccounts(accounts);

  const data = getData();
  if (!data.users[key]) {
    data.users[key] = { subjects: [], studyPlan: [], progress: {}, recycleBin: [] };
    saveData(data);
  }
  return { success: true, displayName: username };
}

export function loginUser(username, password) {
  const accounts = getAccounts();
  const key = username.toLowerCase();
  const account = accounts[key];
  if (!account) return { success: false, error: 'Account not found. Please register first.' };
  if (account.password !== password) return { success: false, error: 'Incorrect password' };

  const data = getData();
  if (!data.users[key]) data.users[key] = { subjects: [], studyPlan: [], progress: {}, recycleBin: [] };
  data.currentUser = key;
  saveData(data);
  return { success: true, displayName: account.displayName };
}

export function resetPassword(username, newPassword) {
  const accounts = getAccounts();
  const key = username.toLowerCase();
  if (!accounts[key]) return { success: false, error: 'Account not found' };
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
  return data.users[username?.toLowerCase()] || { subjects: [], studyPlan: [], progress: {}, recycleBin: [] };
}

function saveUserData(username, userData) {
  const data = getData();
  data.users[username.toLowerCase()] = userData;
  saveData(data);
}

export function getSubjects(username) {
  return getUserData(username).subjects || [];
}

export function saveSubjects(username, subjects) {
  const ud = getUserData(username);
  ud.subjects = subjects;
  saveUserData(username, ud);
}

export function getStudyPlan(username) {
  return getUserData(username).studyPlan || [];
}

export function saveStudyPlan(username, plan) {
  const ud = getUserData(username);
  ud.studyPlan = plan;
  saveUserData(username, ud);
}

export function getProgress(username) {
  return getUserData(username).progress || {};
}

export function saveProgress(username, progress) {
  const ud = getUserData(username);
  ud.progress = progress;
  saveUserData(username, ud);
}

// ── Recycle bin ──

export function getRecycleBin(username) {
  return getUserData(username).recycleBin || [];
}

export function recycleSubject(username, subjectId) {
  const ud = getUserData(username);
  const subject = (ud.subjects || []).find((s) => s.id === subjectId);
  if (!subject) return;
  if (!ud.recycleBin) ud.recycleBin = [];
  ud.recycleBin.push({ ...subject, deletedAt: new Date().toISOString() });
  ud.subjects = ud.subjects.filter((s) => s.id !== subjectId);
  saveUserData(username, ud);
}

export function restoreSubject(username, subjectId) {
  const ud = getUserData(username);
  const item = (ud.recycleBin || []).find((s) => s.id === subjectId);
  if (!item) return;
  const { deletedAt, ...subject } = item;
  ud.subjects = [...(ud.subjects || []), subject];
  ud.recycleBin = ud.recycleBin.filter((s) => s.id !== subjectId);
  saveUserData(username, ud);
}

export function permanentlyDeleteSubject(username, subjectId) {
  const ud = getUserData(username);
  ud.recycleBin = (ud.recycleBin || []).filter((s) => s.id !== subjectId);
  if (ud.studyPlan) {
    ud.studyPlan = ud.studyPlan
      .map((d) => ({ ...d, tasks: d.tasks.filter((t) => t.subjectId !== subjectId) }))
      .filter((d) => d.tasks.length > 0);
  }
  if (ud.progress) {
    const clean = {};
    for (const [k, v] of Object.entries(ud.progress)) {
      if (!k.startsWith(subjectId)) clean[k] = v;
    }
    ud.progress = clean;
  }
  saveUserData(username, ud);
}
