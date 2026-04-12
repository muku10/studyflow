import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getSubjects, getStudyPlan, saveStudyPlan, getProgress, getRecycleBin } from '../utils/storage';
import { getPlanWeeks, generateWeekPlan } from '../utils/studyPlanGenerator';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import CodeEditor, { CodeBlock } from '../components/ui/CodeEditor';
import {
  Sparkles, Calendar, Clock, AlertCircle, Lightbulb, BrainCircuit,
  Loader2, ChevronDown, ChevronUp, ListChecks, Link as LinkIcon,
  BookOpen, CalendarClock, CheckCircle2, Code2, PenLine,
} from 'lucide-react';

const priorityColor = { high: 'border-l-red-500 bg-red-50/30', medium: 'border-l-amber-500 bg-amber-50/30', low: 'border-l-emerald-500 bg-emerald-50/30' };
const priorityBadge = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-emerald-100 text-emerald-700' };

// ── Content accordion ──
function ContentAccordion({ item }) {
  const [open, setOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const hasDesc = item.description?.trim().length > 0;
  const hasCode = item.code?.trim().length > 0;
  const hasExercise = item.exercise?.trim().length > 0;
  const expandable = hasDesc || hasCode || hasExercise;

  return (
    <li className="border border-slate-100 rounded-xl overflow-hidden">
      <button onClick={() => expandable && setOpen((v) => !v)}
        className={`flex items-start gap-2 w-full text-left p-3 text-sm ${expandable ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}`}>
        <span className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
        <span className={`flex-1 font-medium ${open ? 'text-indigo-700' : 'text-slate-800'}`}>{item.topic}</span>
        <div className="flex items-center gap-1 shrink-0">
          {hasCode && <Code2 className="w-3.5 h-3.5 text-emerald-500" />}
          {hasExercise && <PenLine className="w-3.5 h-3.5 text-amber-500" />}
          {expandable && (open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pl-7 space-y-3">
          {hasDesc && <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>}
          {hasCode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Code2 className="w-3 h-3" /> Code</p>
                <button onClick={(e) => { e.stopPropagation(); setShowEditor((v) => !v); }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  {showEditor ? 'Read-only' : 'Open Editor'}
                </button>
              </div>
              {showEditor ? <CodeEditor initialCode={item.code} /> : <CodeBlock code={item.code} />}
            </div>
          )}
          {hasExercise && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1 mb-1.5"><PenLine className="w-3 h-3" /> Exercise</p>
              <p className="text-sm text-amber-900 leading-relaxed">{item.exercise}</p>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ── Task card ──
function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const hasContent = task.content?.length > 0;
  return (
    <div className={`rounded-xl border-l-4 ${priorityColor[task.priority]} transition-all`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full p-4 text-left">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{task.subjectTitle}</p>
              {task.carriedOver && <span className="text-xs font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Missed</span>}
            </div>
            <p className="text-sm text-slate-600 mt-0.5">{task.taskType}</p>
          </div>
          <div className="flex items-center gap-2 pt-0.5 shrink-0">
            <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3.5 h-3.5" />{task.duration} min</span>
            {hasContent && (expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />)}
          </div>
        </div>
        {task.tip && (
          <div className="mt-2.5 flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{task.tip}</span>
          </div>
        )}
      </button>
      {expanded && hasContent && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              <ListChecks className="w-3.5 h-3.5" /> What to Study <span className="text-slate-400 font-normal normal-case">(click to expand)</span>
            </div>
            <ul className="space-y-2">{task.content.map((item, i) => <ContentAccordion key={i} item={item} />)}</ul>
          </div>
          {task.resources && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5"><LinkIcon className="w-3.5 h-3.5" /> Resources</div>
              <p className="text-sm text-slate-600">{task.resources}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──
export default function StudyPlan() {
  const { userKey } = useUser();
  const subjects = getSubjects(userKey);
  const [plan, setPlan] = useState(() => getStudyPlan(userKey));
  const [generating, setGenerating] = useState(false);
  const [generatingWeek, setGeneratingWeek] = useState(null);
  const [error, setError] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);

  const progress = getProgress(userKey);
  const today = new Date().toISOString().split('T')[0];
  const recycledIds = new Set(getRecycleBin(userKey).map((s) => s.id));
  const activeSubjects = subjects.filter((s) => !recycledIds.has(s.id));

  // Current subject (default to first)
  const currentSubjectId = selectedSubjectId || activeSubjects[0]?.id || null;
  const currentSubject = activeSubjects.find((s) => s.id === currentSubjectId);

  // Weeks for current subject
  const subjectWeeks = currentSubject ? getPlanWeeks([currentSubject]) : [];

  // Which weeks have content for this subject
  const generatedWeeks = new Set();
  for (const day of plan) {
    if (day.tasks.some((t) => t.subjectId === currentSubjectId)) {
      const w = subjectWeeks.find((wk) => day.date >= wk.startDate && day.date <= wk.endDate);
      if (w) generatedWeeks.add(w.week);
    }
  }

  const activeWeek = selectedWeek || subjectWeeks.find((w) => generatedWeeks.has(w.week))?.week || subjectWeeks[0]?.week || null;
  const activeWeekInfo = subjectWeeks.find((w) => w.week === activeWeek);

  // Filter plan for current subject + selected week
  const filteredPlan = plan
    .filter((day) => {
      if (activeWeekInfo && (day.date < activeWeekInfo.startDate || day.date > activeWeekInfo.endDate)) return false;
      return true;
    })
    .map((day) => ({
      ...day,
      tasks: day.tasks.filter((t) => {
        if (t.subjectId !== currentSubjectId) return false;
        if (progress[t.id]) return false;
        return true;
      }),
    }))
    .filter((day) => day.tasks.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleGenerateWeek = async (weekNum, isRegenerate = false) => {
    if (!currentSubject) return;
    const weekInfo = subjectWeeks.find((w) => w.week === weekNum);
    if (!weekInfo) return;

    setGenerating(true);
    setGeneratingWeek(weekNum);
    setError('');

    try {
      // Collect ALL previously covered topics for THIS subject
      const prevTopics = plan
        .filter((d) => d.date < weekInfo.startDate)
        .flatMap((d) => d.tasks
          .filter((t) => t.subjectId === currentSubjectId)
          .flatMap((t) => {
            const topics = [t.taskType];
            if (t.content) t.content.forEach((c) => { if (c.topic) topics.push(c.topic); });
            return topics;
          })
        );

      if (isRegenerate) {
        const existing = plan
          .filter((d) => d.date >= weekInfo.startDate && d.date <= weekInfo.endDate)
          .flatMap((d) => d.tasks
            .filter((t) => t.subjectId === currentSubjectId)
            .flatMap((t) => {
              const topics = [t.taskType];
              if (t.content) t.content.forEach((c) => { if (c.topic) topics.push(c.topic); });
              return topics;
            })
          );
        prevTopics.push(...existing);
      }

      // Generate for only this subject
      const newDays = await generateWeekPlan([currentSubject], weekInfo, prevTopics);

      // Merge: keep other subjects' tasks, replace this subject's tasks for this week
      const updated = plan.map((d) => {
        if (d.date < weekInfo.startDate || d.date > weekInfo.endDate) return d;
        return { ...d, tasks: d.tasks.filter((t) => t.subjectId !== currentSubjectId) };
      }).filter((d) => d.tasks.length > 0);

      // Add new days, merging with existing days that have other subjects
      for (const newDay of newDays) {
        const existing = updated.find((d) => d.date === newDay.date);
        if (existing) {
          existing.tasks.push(...newDay.tasks);
        } else {
          updated.push(newDay);
        }
      }

      updated.sort((a, b) => a.date.localeCompare(b.date));
      saveStudyPlan(userKey, updated);
      setPlan(updated);
      setSelectedWeek(weekNum);
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err?.message || String(err));
    } finally {
      setGenerating(false);
      setGeneratingWeek(null);
    }
  };

  // Stats for current subject
  const subjectTasks = plan.flatMap((d) => d.tasks.filter((t) => t.subjectId === currentSubjectId));
  const completedCount = subjectTasks.filter((t) => progress[t.id]).length;
  const totalMin = subjectTasks.reduce((sum, t) => sum + t.duration, 0);
  const doneMin = subjectTasks.filter((t) => progress[t.id]).reduce((sum, t) => sum + t.duration, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">AI Study Plan</h1>
        <p className="text-slate-500 mt-1">Select a subject, then generate weekly study content</p>
      </div>

      {activeSubjects.length === 0 ? (
        <Card><CardBody className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No subjects added</h3>
          <p className="text-slate-500 text-sm">Add subjects first to generate study plans</p>
        </CardBody></Card>
      ) : (
        <>
          {/* Subject tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {activeSubjects.map((s) => (
              <button key={s.id} onClick={() => { setSelectedSubjectId(s.id); setSelectedWeek(null); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all whitespace-nowrap flex items-center gap-2 ${
                  currentSubjectId === s.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}>
                <BookOpen className="w-4 h-4" />
                {s.title}
              </button>
            ))}
          </div>

          {/* Subject info bar */}
          {currentSubject && (
            <Card className="mb-6">
              <CardBody className="flex flex-wrap items-center gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">{currentSubject.title}</h2>
                  {currentSubject.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{currentSubject.description}</p>}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityBadge[currentSubject.priority]}`}>{currentSubject.priority}</span>
                  <span className="flex items-center gap-1"><CalendarClock className="w-4 h-4" />{new Date(currentSubject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{currentSubject.hoursPerDay || 2}h/day</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{completedCount}/{subjectTasks.length} tasks</span>
                  {totalMin > 0 && <span className="text-xs text-slate-400">{doneMin}/{totalMin} min</span>}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Week cards */}
          {subjectWeeks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Weekly Plan for {currentSubject?.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {subjectWeeks.map((w) => {
                  const isGenerated = generatedWeeks.has(w.week);
                  const isSelected = activeWeek === w.week;
                  const isGenerating = generating && generatingWeek === w.week;
                  return (
                    <div key={w.week}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : isGenerated ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-white'
                      } ${generating && !isGenerating ? 'opacity-50' : ''}`}>
                      <button onClick={() => isGenerated ? setSelectedWeek(w.week) : handleGenerateWeek(w.week)} disabled={generating} className="w-full text-left">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-slate-900">{w.label}</span>
                          {isGenerating && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                          {isGenerated && !isGenerating && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {!isGenerated && !isGenerating && <Sparkles className="w-4 h-4 text-slate-300" />}
                        </div>
                        <p className="text-xs text-slate-500">{w.range}</p>
                        <p className="text-xs mt-1 font-medium">
                          {isGenerating ? <span className="text-indigo-600">Generating...</span>
                            : isGenerated ? <span className="text-emerald-600">Ready</span>
                            : <span className="text-slate-400">Click to generate</span>}
                        </p>
                      </button>
                      {isGenerated && !isGenerating && (
                        <button onClick={() => handleGenerateWeek(w.week, true)} disabled={generating}
                          className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50">
                          <Sparkles className="w-3 h-3" /> Regenerate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-line">{error}</div>}

          {/* Content */}
          {generating && generatingWeek === activeWeek ? (
            <Card><CardBody className="text-center py-16">
              <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">Generating {activeWeekInfo?.label}...</h3>
              <p className="text-slate-500 text-sm">{activeWeekInfo?.range} — building detailed content day by day</p>
            </CardBody></Card>
          ) : filteredPlan.length === 0 ? (
            <Card><CardBody className="text-center py-16">
              {generatedWeeks.has(activeWeek) ? (
                <><CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">All tasks completed for this week!</h3>
                <p className="text-slate-500 text-sm mb-4">You can regenerate for fresh content.</p></>
              ) : (
                <><BrainCircuit className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">{activeWeekInfo ? `${activeWeekInfo.label} not generated yet` : 'Select a week above'}</h3>
                <p className="text-slate-500 text-sm mb-4">Click a week card to generate detailed study content</p></>
              )}
              {activeWeekInfo && (
                <Button onClick={() => handleGenerateWeek(activeWeek, generatedWeeks.has(activeWeek))} disabled={generating}>
                  <Sparkles className="w-4 h-4" /> {generatedWeeks.has(activeWeek) ? 'Regenerate' : 'Generate'} {activeWeekInfo.label}
                </Button>
              )}
            </CardBody></Card>
          ) : (
            <div className="space-y-6">
              {filteredPlan.map((day) => {
                const isToday = day.date === today;
                const missedCount = day.tasks.filter((t) => t.carriedOver).length;
                return (
                  <Card key={day.date} className={isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}>
                    <div className="px-6 py-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900">{day.dayLabel}</span>
                      {isToday && <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Today</span>}
                      {missedCount > 0 && <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">+{missedCount} missed</span>}
                      <span className="text-xs text-slate-400 ml-auto">{day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}</span>
                    </div>
                    <CardBody>
                      <div className="space-y-3">{day.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
