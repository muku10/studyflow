import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { getSubjects, getStudyPlan, saveStudyPlan, getProgress, getRecycleBin } from '../utils/storage';
import { getPlanWeeks, generateWeekPlan } from '../utils/studyPlanGenerator';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import CodeEditor, { CodeBlock } from '../components/ui/CodeEditor';
import {
  Sparkles,
  Calendar,
  Clock,
  AlertCircle,
  Lightbulb,
  BrainCircuit,
  Loader2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Link as LinkIcon,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Code2,
  PenLine,
} from 'lucide-react';

const priorityColor = {
  high: 'border-l-red-500 bg-red-50/50',
  medium: 'border-l-yellow-500 bg-yellow-50/50',
  low: 'border-l-green-500 bg-green-50/50',
};
const priorityBadge = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

// ── Subject chips ──
function SubjectChips({ subjects, selectedId, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedId === null ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'}`}>
        All Subjects
      </button>
      {subjects.map((s) => (
        <button key={s.id} onClick={() => onChange(selectedId === s.id ? null : s.id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors flex items-center gap-1.5 ${selectedId === s.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'}`}>
          {selectedId === s.id && <CheckCircle2 className="w-3.5 h-3.5" />}
          {s.title}
        </button>
      ))}
    </div>
  );
}

// ── Subject info cards ──
function SubjectInfoCards({ subjects }) {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {subjects.map((s) => {
        const isOpen = expandedId === s.id;
        const daysLeft = Math.ceil((new Date(s.deadline) - new Date()) / 86400000);
        return (
          <div key={s.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setExpandedId(isOpen ? null : s.id)} className="w-full p-3 text-left hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${priorityBadge[s.priority]}`}>{s.priority}</span>
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{new Date(s.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className={daysLeft <= 3 ? 'text-red-600 font-medium' : ''}>{daysLeft <= 0 ? 'Overdue' : `${daysLeft}d left`}</span>
              </div>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 border-t border-gray-100">
                {s.description ? (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Course Content</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{s.description}</p>
                  </div>
                ) : <p className="mt-2 text-xs text-gray-400 italic">No description added</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Content accordion ──
function ContentAccordion({ item }) {
  const [open, setOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const hasDesc = item.description?.trim().length > 0;
  const hasCode = item.code?.trim().length > 0;
  const hasExercise = item.exercise?.trim().length > 0;
  const expandable = hasDesc || hasCode || hasExercise;

  return (
    <li className="border border-gray-100 rounded-lg overflow-hidden">
      <button onClick={() => expandable && setOpen((v) => !v)}
        className={`flex items-start gap-2 w-full text-left p-2.5 text-sm ${expandable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
        <span className={`flex-1 font-medium ${open ? 'text-indigo-700' : 'text-gray-800'}`}>{item.topic}</span>
        <div className="flex items-center gap-1 shrink-0">
          {hasCode && <Code2 className="w-3.5 h-3.5 text-emerald-500" />}
          {hasExercise && <PenLine className="w-3.5 h-3.5 text-amber-500" />}
          {expandable && (open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 mt-0.5" />)}
        </div>
      </button>
      {open && (
        <div className="px-2.5 pb-3 pl-6 space-y-3">
          {hasDesc && <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>}
          {hasCode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1"><Code2 className="w-3 h-3" /> Code</p>
                <button onClick={(e) => { e.stopPropagation(); setShowEditor((v) => !v); }} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  {showEditor ? 'Read-only' : 'Open Editor'}
                </button>
              </div>
              {showEditor ? <CodeEditor initialCode={item.code} /> : <CodeBlock code={item.code} />}
            </div>
          )}
          {hasExercise && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
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
    <div className={`rounded-lg border-l-4 ${priorityColor[task.priority]} transition-all`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full p-3 text-left">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">{task.subjectTitle}</p>
              {task.carriedOver && <span className="text-xs font-medium bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">Missed</span>}
            </div>
            <p className="text-sm text-gray-700 mt-0.5">{task.taskType}</p>
          </div>
          <div className="flex items-center gap-2 pt-0.5 shrink-0">
            <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" />{task.duration} min</span>
            {hasContent && (expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />)}
          </div>
        </div>
        {task.tip && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-md px-2.5 py-1.5">
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span>{task.tip}</span>
          </div>
        )}
      </button>
      {expanded && hasContent && (
        <div className="px-3 pb-3 space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <ListChecks className="w-3.5 h-3.5" /> What to Study <span className="text-gray-400 font-normal normal-case">(click to expand)</span>
            </div>
            <ul className="space-y-1.5">{task.content.map((item, i) => <ContentAccordion key={i} item={item} />)}</ul>
          </div>
          {task.resources && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5"><LinkIcon className="w-3.5 h-3.5" /> Resources</div>
              <p className="text-sm text-gray-600">{task.resources}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Week selector ──
function WeekSelector({ weeks, generatedWeeks, selectedWeek, onSelect, onGenerate, onRegenerate, generating, generatingWeek }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Select a week to view or generate</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {weeks.map((w) => {
          const isGenerated = generatedWeeks.has(w.week);
          const isSelected = selectedWeek === w.week;
          const isGenerating = generating && generatingWeek === w.week;

          return (
            <div
              key={w.week}
              className={`relative p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : isGenerated
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              } ${generating && !isGenerating ? 'opacity-50' : ''}`}
            >
              <button
                onClick={() => isGenerated ? onSelect(w.week) : onGenerate(w.week)}
                disabled={generating}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{w.label}</span>
                  {isGenerating && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                  {isGenerated && !isGenerating && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {!isGenerated && !isGenerating && <Sparkles className="w-4 h-4 text-gray-300" />}
                </div>
                <p className="text-xs text-gray-500">{w.range}</p>
                <p className="text-xs mt-1">
                  {isGenerating
                    ? <span className="text-indigo-600 font-medium">Generating...</span>
                    : isGenerated
                    ? <span className="text-green-600">Ready to view</span>
                    : <span className="text-gray-400">Click to generate</span>
                  }
                </p>
              </button>
              {/* Regenerate button for already generated weeks */}
              {isGenerated && !isGenerating && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRegenerate(w.week); }}
                  disabled={generating}
                  className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" /> Regenerate
                </button>
              )}
            </div>
          );
        })}
      </div>
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
  const weeks = getPlanWeeks(subjects);
  const today = new Date().toISOString().split('T')[0];

  // Active subject IDs — exclude recycled subjects
  const recycledIds = new Set(getRecycleBin(userKey).map((s) => s.id));
  const activeSubjectIds = new Set(subjects.map((s) => s.id));

  // Track which weeks have been generated (only count tasks from active subjects)
  const generatedWeeks = new Set();
  for (const day of plan) {
    const hasActiveTasks = day.tasks.some((t) => activeSubjectIds.has(t.subjectId) && !recycledIds.has(t.subjectId));
    if (hasActiveTasks) {
      const w = weeks.find((wk) => day.date >= wk.startDate && day.date <= wk.endDate);
      if (w) generatedWeeks.add(w.week);
    }
  }

  // Auto-select first generated week or current week
  const activeWeek = selectedWeek || weeks.find((w) => generatedWeeks.has(w.week))?.week || null;
  const activeWeekInfo = weeks.find((w) => w.week === activeWeek);

  // Helper: is this task visible (not recycled, not completed, matches subject filter)
  const isTaskVisible = (t) => {
    if (recycledIds.has(t.subjectId)) return false;
    if (!activeSubjectIds.has(t.subjectId)) return false;
    if (progress[t.id]) return false;
    if (selectedSubjectId !== null && t.subjectId !== selectedSubjectId) return false;
    return true;
  };

  // Collect missed tasks from past days
  const missedTasks = [];
  for (const day of plan) {
    if (day.date >= today) break;
    for (const task of day.tasks) {
      if (isTaskVisible(task)) {
        missedTasks.push({ ...task, carriedOver: true, originalDate: day.date });
      }
    }
  }

  // Filter plan for selected week, inject missed into today, show all days in the week (including past)
  const filteredPlan = plan
    .filter((day) => {
      if (activeWeekInfo && (day.date < activeWeekInfo.startDate || day.date > activeWeekInfo.endDate)) return false;
      return true;
    })
    .map((day) => {
      let tasks = day.tasks.filter(isTaskVisible);

      // Stack missed tasks onto today
      if (day.date === today) {
        tasks = [...missedTasks.filter(isTaskVisible), ...tasks];
      }

      return { ...day, tasks };
    })
    .filter((day) => day.tasks.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleGenerateWeek = async (weekNum, isRegenerate = false) => {
    const weekInfo = weeks.find((w) => w.week === weekNum);
    if (!weekInfo) return;

    setGenerating(true);
    setGeneratingWeek(weekNum);
    setError('');

    try {
      // Collect previously covered topics from earlier weeks
      const prevTopics = plan
        .filter((d) => d.date < weekInfo.startDate)
        .flatMap((d) => d.tasks.map((t) => t.taskType));

      // On regenerate, also pass THIS week's existing topics so AI generates different content
      if (isRegenerate) {
        const existingThisWeek = plan
          .filter((d) => d.date >= weekInfo.startDate && d.date <= weekInfo.endDate)
          .flatMap((d) => d.tasks.flatMap((t) => t.content?.map((c) => c.topic) || []));
        prevTopics.push(...existingThisWeek.map((t) => `[ALREADY COVERED - SKIP] ${t}`));
      }

      const newDays = await generateWeekPlan(subjects, weekInfo, prevTopics);

      // Merge: remove old days in this week range, add new ones
      const updated = plan.filter((d) => d.date < weekInfo.startDate || d.date > weekInfo.endDate);
      updated.push(...newDays);
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

  const displaySubjects = selectedSubjectId === null ? subjects : subjects.filter((s) => s.id === selectedSubjectId);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Study Plan</h1>
        <p className="text-gray-500 mt-1">Generate one week at a time — click a week to generate or view it</p>
      </div>

      {subjects.length > 0 && (
        <>
          <SubjectChips subjects={subjects} selectedId={selectedSubjectId} onChange={setSelectedSubjectId} />
          <SubjectInfoCards subjects={displaySubjects} />
          {weeks.length > 0 && (
            <WeekSelector
              weeks={weeks}
              generatedWeeks={generatedWeeks}
              selectedWeek={activeWeek}
              onSelect={setSelectedWeek}
              onGenerate={(w) => handleGenerateWeek(w, false)}
              onRegenerate={(w) => handleGenerateWeek(w, true)}
              generating={generating}
              generatingWeek={generatingWeek}
            />
          )}
        </>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 whitespace-pre-line">{error}</div>
      )}

      {subjects.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects added</h3>
            <p className="text-gray-500 text-sm">Add subjects with detailed descriptions first</p>
          </CardBody>
        </Card>
      ) : !activeWeek ? (
        <Card>
          <CardBody className="text-center py-16">
            <BrainCircuit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Select a week to get started</h3>
            <p className="text-gray-500 text-sm">Click any week above to generate your study plan for that week</p>
          </CardBody>
        </Card>
      ) : generating && generatingWeek === activeWeek ? (
        <Card>
          <CardBody className="text-center py-16">
            <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Generating {activeWeekInfo?.label}...</h3>
            <p className="text-gray-500 text-sm">{activeWeekInfo?.range}</p>
          </CardBody>
        </Card>
      ) : filteredPlan.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            {generatedWeeks.has(activeWeek) ? (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">All tasks completed for this week</h3>
                <p className="text-gray-500 text-sm mb-4">Great job! You can regenerate if you want fresh content.</p>
              </>
            ) : (
              <>
                <BrainCircuit className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No plan for {activeWeekInfo?.label} yet</h3>
                <p className="text-gray-500 text-sm mb-4">Click below to generate study tasks for this week</p>
              </>
            )}
            <Button onClick={() => handleGenerateWeek(activeWeek)} disabled={generating}>
              <Sparkles className="w-4 h-4" />
              {generatedWeeks.has(activeWeek) ? 'Regenerate' : 'Generate'} {activeWeekInfo?.label}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredPlan.map((day) => {
            const isToday = day.date === today;
            const missedCount = day.tasks.filter((t) => t.carriedOver).length;
            return (
              <Card key={day.date} className={isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}>
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{day.dayLabel}</span>
                  {isToday && <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Today</span>}
                  {missedCount > 0 && <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">+{missedCount} missed</span>}
                  <span className="text-xs text-gray-400 ml-auto">{day.tasks.length} task{day.tasks.length !== 1 ? 's' : ''}</span>
                </div>
                <CardBody>
                  <div className="space-y-3">{day.tasks.map((task) => <TaskCard key={task.id} task={task} />)}</div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
