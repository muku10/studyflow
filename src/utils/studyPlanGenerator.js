import Groq from 'groq-sdk';

function repairAndParse(str) {
  let s = str;
  if (!s.trimStart().startsWith('[')) s = '[' + s;
  for (let i = s.length - 1; i >= Math.max(0, s.length - 500); i--) {
    if (s[i] === '}') {
      let attempt = s.substring(0, i + 1);
      const ob = (attempt.match(/\[/g) || []).length;
      const cb = (attempt.match(/\]/g) || []).length;
      for (let j = 0; j < ob - cb; j++) attempt += ']';
      const oc = (attempt.match(/\{/g) || []).length;
      const cc = (attempt.match(/\}/g) || []).length;
      for (let j = 0; j < oc - cc; j++) attempt += '}';
      const ob2 = (attempt.match(/\[/g) || []).length;
      const cb2 = (attempt.match(/\]/g) || []).length;
      for (let j = 0; j < ob2 - cb2; j++) attempt += ']';
      try { const p = JSON.parse(attempt); if (Array.isArray(p) && p.length > 0) return p; } catch { continue; }
    }
  }
  throw new Error('Could not parse AI response. Please try again.');
}

function parseJSON(raw) {
  const s = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\[[\s\S]*\]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} return repairAndParse(m[0]); }
  return repairAndParse(s);
}

function fmt(d) { return d.toISOString().split('T')[0]; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function dayLabel(ds) { return new Date(ds + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

const MODELS = [
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', maxTokens: 8000 },
  { id: 'llama-3.3-70b-versatile', maxTokens: 8000 },
  { id: 'qwen/qwen3-32b', maxTokens: 8000 },
  { id: 'llama-3.1-8b-instant', maxTokens: 4000, compact: true },
];

function normalizeTasks(rawPlan) {
  return rawPlan.map((day) => ({
    date: day.date,
    dayLabel: dayLabel(day.date),
    tasks: (day.tasks || []).map((task) => ({
      id: `${task.subjectId}-${day.date}-${Math.random().toString(36).slice(2, 7)}`,
      subjectId: task.subjectId,
      subjectTitle: task.subjectTitle,
      date: day.date,
      taskType: task.taskType,
      duration: task.duration,
      priority: task.priority,
      content: (task.content || []).map((c) =>
        typeof c === 'string' ? { topic: c, description: '', code: '', exercise: '' }
          : { topic: c.topic || '', description: c.description || '', code: c.code || '', exercise: c.exercise || '' }
      ),
      resources: task.resources || '',
      tip: task.tip || '',
      completed: false,
    })),
  }));
}

async function callAI(client, sysMsg, userMsg) {
  for (let i = 0; i < MODELS.length; i++) {
    const { id, maxTokens, compact } = MODELS[i];
    const msgs = compact ? [{ role: 'user', content: userMsg }] : [{ role: 'system', content: sysMsg }, { role: 'user', content: userMsg }];
    try {
      console.log(`Trying: ${id}`);
      const r = await client.chat.completions.create({ model: id, messages: msgs, temperature: 0.7, max_tokens: maxTokens });
      const c = r.choices[0].message.content.trim();
      console.log(`${id}: ${c.length} chars`);
      return c;
    } catch (err) {
      console.warn(`${id} failed:`, err?.status, err?.message?.slice(0, 80));
      const m = err?.message || '';
      if (([429, 400, 404, 413].includes(err?.status) || m.includes('rate_limit') || m.includes('not found') || m.includes('too large')) && i < MODELS.length - 1) continue;
      throw err;
    }
  }
  throw new Error('All models rate-limited. Try again later.');
}

// ── Public API ──

export function getPlanWeeks(subjects) {
  if (!subjects || subjects.length === 0) return [];
  const today = fmt(new Date());
  const starts = subjects.map((s) => new Date(s.startDate || today));
  const deadlines = subjects.map((s) => new Date(s.deadline));
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const effectiveStart = new Date(Math.max(Math.min(...starts), now));
  const furthest = new Date(Math.max(...deadlines));
  const totalDays = Math.max(1, Math.ceil((furthest - effectiveStart) / 86400000));
  const weeks = [];
  const totalWeeks = Math.ceil(totalDays / 7);
  for (let w = 0; w < totalWeeks; w++) {
    const start = addDays(effectiveStart, w * 7);
    const end = addDays(effectiveStart, Math.min((w + 1) * 7 - 1, totalDays - 1));
    weeks.push({
      week: w + 1, startDate: fmt(start), endDate: fmt(end),
      days: Math.ceil((end - start) / 86400000) + 1,
      label: `Week ${w + 1}`,
      range: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }
  return weeks;
}

/**
 * Step 1: Generate a syllabus outline for the subject.
 * Returns array of topic names distributed across all days.
 */
async function generateSyllabus(client, subject, totalDays, prevTopics) {
  const coveredStr = prevTopics.length > 0
    ? `\nAlready covered (skip these): ${prevTopics.join(', ')}`
    : '';

  const sysMsg = `You are a university curriculum expert. You know the EXACT syllabus of every major university course worldwide.

CRITICAL: When the user mentions a specific university, program, semester, or board — you MUST generate topics from that EXACT official syllabus. Do NOT make up generic topics.

Examples:
- "BSc CSIT TU 6th semester Dot Net" → Use Tribhuvan University BSc CSIT 6th sem .NET syllabus: Unit 1 (Introduction to .NET Framework, CLR, CTS, CLS), Unit 2 (C# Fundamentals), Unit 3 (OOP in C#), Unit 4 (Windows Forms), Unit 5 (ADO.NET), Unit 6 (ASP.NET), etc.
- "BSc CSIT TU 4th semester Data Structures" → Use TU syllabus: Stack, Queue, Linked List, Trees, BST, AVL, Heap, Graph, Hashing, Sorting
- "CBSE Class 12 Physics" → Use NCERT chapters: Electric Charges, Electrostatic Potential, Current Electricity, etc.

Return ONLY a JSON array. No explanation.`;

  const msg = `Subject: "${subject.title}"
Course details: "${subject.description || 'none'}"
Total study days: ${totalDays}
Hours per day: ${subject.hoursPerDay || 2}
${coveredStr}

Based on the course details above, create a syllabus with EXACTLY ${totalDays} topics in the correct curriculum order.

If the description mentions a university/program/semester (like "BSc CSIT TU 6th semester"), you MUST follow that university's OFFICIAL syllabus for this subject. Break each syllabus unit into daily topics.

Return ONLY a JSON array of ${totalDays} topic names. No day numbers. No generic topics. Follow the real syllabus.
Example format: ["Introduction to .NET Framework","CLR Architecture and CTS","C# Basics: Variables and Data Types",...]`;

  const raw = await callAI(client, sysMsg, msg);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  const m = cleaned.match(/\[[\s\S]*?\]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

/**
 * Step 2: Generate detailed content for a single day following the syllabus.
 */
async function generateDayContent(client, subject, dateStr, dayNum, topicName, prevTopics) {
  const sysPrompt = `You create detailed study content as JSON. Student learns ENTIRELY from your output — they should NOT need any other resource.

RULES for content:
- "description": 6+ sentences. Include: what it is, why it matters, exact syntax/structure, step-by-step how it works, a worked example with result, common mistakes
- "code": 10+ lines of complete runnable code with // comments (for CS), or formulas with fully worked numerical solution (for math/science). NEVER empty.
- "exercise": specific problem with concrete values (e.g. "Write a function that takes [3,1,4,1,5] and returns the second largest element")
- Generate 3-5 content items per task. Each item teaches a sub-topic within the day's theme.
- NO empty fields.`;

  const userMsg = `Day ${dayNum} (${dateStr}) of "${subject.title}".
Today's topic: "${topicName}"
${subject.description ? `Course info: ${subject.description}` : ''}

Generate 3-5 detailed sub-topics under "${topicName}". Each must have full teaching content.

Return ONLY JSON (single object):
{"date":"${dateStr}","tasks":[{"subjectId":"${subject.id}","subjectTitle":"${subject.title}","taskType":"Day ${dayNum}: ${topicName}","duration":${(subject.hoursPerDay || 2) * 60},"priority":"${subject.priority}","content":[{"topic":"<sub-topic>","description":"<6+ sentence teaching>","code":"<10+ line code>","exercise":"<specific problem>"},...],"resources":"<references>","tip":"<study advice>"}]}`;

  const raw = await callAI(client, sysPrompt, userMsg);
  let parsed;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    parsed = JSON.parse(cleaned);
  } catch {
    try { parsed = parseJSON(raw); } catch { return null; }
  }
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

/**
 * Main: Generate plan for a week.
 * Step 1: Get syllabus outline (or use existing one).
 * Step 2: Generate detailed content day by day.
 */
export async function generateWeekPlan(subjects, weekInfo, prevTopics = []) {
  if (!subjects || subjects.length === 0) return [];

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API key not configured. Add VITE_GROQ_API_KEY to .env file.');
  }

  const today = fmt(new Date());
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  const subject = subjects[0]; // Subject-based: one subject at a time

  if (!subject) return [];

  // Calculate total course days for syllabus planning
  const sStart = new Date(subject.startDate || today);
  const sEnd = new Date(subject.deadline);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const courseStart = sStart < now ? now : sStart;
  const totalCourseDays = Math.max(1, Math.ceil((sEnd - courseStart) / 86400000));

  // Step 1: Generate syllabus outline for the ENTIRE course
  console.log(`Step 1: Generating syllabus for ${subject.title} (${totalCourseDays} days)`);
  let syllabus = await generateSyllabus(client, subject, totalCourseDays, prevTopics);

  if (!syllabus || syllabus.length === 0) {
    // Fallback: generate without syllabus
    syllabus = Array.from({ length: totalCourseDays }, (_, i) => `Topic ${i + 1}`);
  }

  // Ensure syllabus covers enough days
  while (syllabus.length < totalCourseDays) {
    syllabus.push(`Advanced Topic ${syllabus.length + 1}`);
  }

  await new Promise((r) => setTimeout(r, 1000));

  // Step 2: Generate detailed content for each day in this week
  const allDays = [];
  const weekStart = new Date(weekInfo.startDate);
  const dayOffset = Math.max(0, Math.ceil((weekStart - courseStart) / 86400000));

  for (let dayIdx = 0; dayIdx < weekInfo.days; dayIdx++) {
    const dayDate = addDays(weekStart, dayIdx);
    const dateStr = fmt(dayDate);
    const globalDayNum = dayOffset + dayIdx + 1;
    // Strip any "Day N:" prefix the AI may have added in the syllabus
    const rawTopic = syllabus[dayOffset + dayIdx] || `Review & Practice`;
    const topicName = rawTopic.replace(/^Day\s*\d+\s*[:.\-–—]\s*/i, '').trim();

    console.log(`Step 2: Day ${dayIdx + 1}/${weekInfo.days} — ${topicName}`);

    try {
      const dayObj = await generateDayContent(client, subject, dateStr, globalDayNum, topicName, prevTopics);

      if (dayObj && dayObj.tasks && dayObj.tasks.length > 0) {
        allDays.push(...normalizeTasks([dayObj]));
        // Track covered topics
        for (const t of dayObj.tasks) {
          if (t.content) for (const c of t.content) { if (c.topic) prevTopics.push(c.topic); }
        }
      }
    } catch (err) {
      console.error(`Day ${dateStr} failed:`, err.message);
      if (dayIdx === 0 && allDays.length === 0) throw new Error(err.message);
    }

    if (dayIdx < weekInfo.days - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  if (allDays.length === 0) throw new Error('Failed to generate content. Please try again.');
  return allDays;
}
