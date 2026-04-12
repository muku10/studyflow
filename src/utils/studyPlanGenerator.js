import Groq from 'groq-sdk';

function repairAndParse(str) {
  let s = str;
  if (!s.trimStart().startsWith('[')) s = '[' + s;

  // Strategy 1: walk backwards and try closing brackets
  for (let i = s.length - 1; i >= Math.max(0, s.length - 500); i--) {
    if (s[i] === '}') {
      let attempt = s.substring(0, i + 1);
      // Close all open brackets
      const opens = (attempt.match(/\[/g) || []).length;
      const closes = (attempt.match(/\]/g) || []).length;
      for (let j = 0; j < opens - closes; j++) attempt += ']';
      // Close all open braces
      const openB = (attempt.match(/\{/g) || []).length;
      const closeB = (attempt.match(/\}/g) || []).length;
      for (let j = 0; j < openB - closeB; j++) attempt += '}';
      // Try adding missing brackets again after braces
      const opens2 = (attempt.match(/\[/g) || []).length;
      const closes2 = (attempt.match(/\]/g) || []).length;
      for (let j = 0; j < opens2 - closes2; j++) attempt += ']';
      try {
        const parsed = JSON.parse(attempt);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { continue; }
    }
  }

  // Strategy 2: find the last complete task object and cut there
  const lastTaskEnd = s.lastIndexOf('"completed"');
  if (lastTaskEnd > 0) {
    // Find the next } after completed
    const afterCompleted = s.indexOf('}', lastTaskEnd);
    if (afterCompleted > 0) {
      let attempt = s.substring(0, afterCompleted + 1) + ']}]';
      try {
        const parsed = JSON.parse(attempt);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
  }

  // Strategy 3: find last complete "date" block
  const lastDateBlock = s.lastIndexOf('"tasks"');
  if (lastDateBlock > 0) {
    // Go backwards from lastDateBlock to find the { that starts this day
    for (let i = lastDateBlock; i >= 0; i--) {
      if (s[i] === '{') {
        let attempt = s.substring(0, i);
        // Remove trailing comma
        attempt = attempt.replace(/,\s*$/, '');
        attempt += ']';
        try {
          const parsed = JSON.parse(attempt);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch { continue; }
      }
    }
  }

  throw new Error('AI returned an incomplete response — could not repair JSON.');
}

function parseJSON(raw) {
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  try { return JSON.parse(jsonStr); } catch {}
  const match = jsonStr.match(/\[[\s\S]*\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    return repairAndParse(match[0]);
  }
  return repairAndParse(jsonStr);
}

function fmt(date) { return date.toISOString().split('T')[0]; }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function dayLabel(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

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
      content: (task.content || []).map((item) =>
        typeof item === 'string'
          ? { topic: item, description: '', code: '', exercise: '' }
          : {
              topic: item.topic || '',
              description: item.description || '',
              code: item.code || '',
              exercise: item.exercise || '',
            }
      ),
      resources: task.resources || '',
      tip: task.tip || '',
      completed: false,
    })),
  }));
}

async function callAI(client, systemMsg, userMsg) {
  for (let i = 0; i < MODELS.length; i++) {
    const { id, maxTokens, compact } = MODELS[i];
    const isLast = i === MODELS.length - 1;
    const messages = compact
      ? [{ role: 'user', content: userMsg }]
      : [{ role: 'system', content: systemMsg }, { role: 'user', content: userMsg }];
    try {
      console.log(`Trying model: ${id}`);
      const res = await client.chat.completions.create({
        model: id, messages, temperature: 0.7, max_tokens: maxTokens,
      });
      const content = res.choices[0].message.content.trim();
      console.log(`Model ${id} returned ${content.length} chars`);
      return content;
    } catch (err) {
      console.warn(`Model ${id} failed:`, err?.status, err?.message?.slice(0, 100));
      const msg = err?.message || '';
      const skip = [429, 400, 404, 413].includes(err?.status)
        || msg.includes('rate_limit') || msg.includes('decommissioned')
        || msg.includes('not found') || msg.includes('not exist')
        || msg.includes('too large') || msg.includes('Request too large');
      if (skip && !isLast) continue;
      throw err;
    }
  }
  throw new Error('All models are rate-limited. Try again later.');
}

/**
 * Get plan metadata — how many weeks, date ranges.
 */
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
      week: w + 1,
      startDate: fmt(start),
      endDate: fmt(end),
      days: Math.ceil((end - start) / 86400000) + 1,
      label: `Week ${w + 1}`,
      range: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    });
  }
  return weeks;
}

/**
 * Generate plan for a single week only.
 * prevTopics: array of topic names already covered in earlier weeks.
 */
export async function generateWeekPlan(subjects, weekInfo, prevTopics = []) {
  if (!subjects || subjects.length === 0) return [];

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_api_key_here') {
    throw new Error(
      'Groq API key is not configured.\n\n' +
      '1. Go to https://console.groq.com/keys\n' +
      '2. Sign up free → Create API Key\n' +
      '3. Add to .env: VITE_GROQ_API_KEY=gsk_...\n' +
      '4. Restart dev server'
    );
  }

  const today = fmt(new Date());
  const client = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  // Filter subjects active in this week
  const activeSubjects = subjects.filter((s) => {
    const sStart = new Date(s.startDate || today);
    const sEnd = new Date(s.deadline);
    const wStart = new Date(weekInfo.startDate);
    const wEnd = new Date(weekInfo.endDate);
    return sStart <= wEnd && sEnd >= wStart;
  });

  if (activeSubjects.length === 0) return [];

  const activeList = activeSubjects.map((s, i) =>
    `${i + 1}. ID:"${s.id}" | "${s.title}" | ${s.description || 'none'} | Start:${s.startDate || today} | Due:${s.deadline} | ${s.priority} | ${s.hoursPerDay || 2}h/day`
  ).join('\n');

  const systemPrompt = `You are a course professor creating a structured curriculum as JSON. Student learns ENTIRELY from your output.

RULES:
- If subject mentions university/semester/board, use EXACT syllabus
- Each day must teach NEW topics — NEVER repeat a topic already listed in "covered so far"
- Follow a logical curriculum order: basics → intermediate → advanced → revision
- "description": 5+ sentences with definition, syntax/formula, worked example, common pitfalls
- "code": complete runnable code with comments (10+ lines for CS), or formulas with worked solution
- "exercise": specific solvable problem with concrete values
- NO empty fields, NO generic content, NO repetition`;

  // Generate 1 day at a time
  const allDays = [];
  const weekStart = new Date(weekInfo.startDate);
  // Track ACTUAL topic names (not just taskType) to prevent repetition
  let coveredTopics = [...prevTopics];

  for (let dayIdx = 0; dayIdx < weekInfo.days; dayIdx++) {
    const dayDate = addDays(weekStart, dayIdx);
    const dateStr = fmt(dayDate);
    const dayNum = (weekInfo.week - 1) * 7 + dayIdx + 1;

    const coveredStr = coveredTopics.length > 0
      ? `ALREADY COVERED (do NOT repeat any of these): ${coveredTopics.slice(-20).join(' | ')}`
      : '';

    const userMsg = `Day ${dayNum} of the course (${dateStr}). ${coveredStr}

Subjects: ${activeList}

Generate the NEXT topics in the curriculum. Each task must cover NEW material not listed above.

Return ONLY JSON (single object, not array):
{"date":"${dateStr}","tasks":[{"subjectId":"<id>","subjectTitle":"<title>","taskType":"<Day ${dayNum}: specific topic name>","duration":<min>,"priority":"high|medium|low","content":[{"topic":"<unique topic>","description":"<5+ sentence detailed teaching>","code":"<complete code/formula>","exercise":"<specific problem>"}],"resources":"<ref>","tip":"<tip>"}]}`;

    try {
      console.log(`Generating day ${dayIdx + 1}/${weekInfo.days}: ${dateStr}`);
      const raw = await callAI(client, systemPrompt, userMsg);

      let parsed;
      try {
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = parseJSON(raw);
      }

      const dayObj = Array.isArray(parsed) ? parsed[0] : parsed;

      if (dayObj && dayObj.tasks && dayObj.tasks.length > 0) {
        const normalized = normalizeTasks([dayObj]);
        allDays.push(...normalized);
        // Track ALL generated topic names for continuity
        for (const task of dayObj.tasks) {
          coveredTopics.push(task.taskType || '');
          if (task.content) {
            for (const c of task.content) {
              if (c.topic) coveredTopics.push(c.topic);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Day ${dateStr} failed:`, err.message);
      if (dayIdx === 0 && allDays.length === 0) {
        throw new Error(err.message || 'AI generation failed');
      }
    }

    if (dayIdx < weekInfo.days - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  if (allDays.length === 0) {
    throw new Error('Failed to generate content for this week. Please try again.');
  }

  return allDays;
}
