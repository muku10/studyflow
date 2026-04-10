import { useState } from 'react';
import { useUser } from '../context/UserContext';
import {
  getSubjects, saveSubjects, getRecycleBin,
  recycleSubject, restoreSubject, permanentlyDeleteSubject,
} from '../utils/storage';
import Card, { CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input, { Select, Textarea } from '../components/ui/Input';
import {
  Plus, Pencil, Trash2, BookOpen, Calendar, Clock,
  RotateCcw, AlertTriangle, Archive, ChevronUp,
} from 'lucide-react';

const emptySubject = { title: '', description: '', startDate: '', deadline: '', priority: 'medium', hoursPerDay: '2' };

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
const priorityBadge = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function Subjects() {
  const { userKey } = useUser();
  const [subjects, setSubjects] = useState(() => getSubjects(userKey));
  const [recycleBin, setRecycleBin] = useState(() => getRecycleBin(userKey));
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptySubject);
  const [showRecycleBin, setShowRecycleBin] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState(null); // { type, id, title }

  const reload = () => {
    setSubjects(getSubjects(userKey));
    setRecycleBin(getRecycleBin(userKey));
  };

  const persist = (updated) => {
    setSubjects(updated);
    saveSubjects(userKey, updated);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptySubject);
    setModalOpen(true);
  };

  const openEdit = (subject) => {
    setEditingId(subject.id);
    setForm({
      title: subject.title, description: subject.description,
      startDate: subject.startDate || '', deadline: subject.deadline,
      priority: subject.priority, hoursPerDay: subject.hoursPerDay || '2',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.deadline) return;
    if (editingId) {
      persist(subjects.map((s) => (s.id === editingId ? { ...s, ...form } : s)));
    } else {
      persist([...subjects, { ...form, id: crypto.randomUUID() }]);
    }
    setModalOpen(false);
  };

  // Move to recycle bin (with confirmation)
  const handleRecycle = (subject) => {
    setConfirmAction({ type: 'recycle', id: subject.id, title: subject.title });
  };

  // Permanently delete from recycle bin (with confirmation)
  const handlePermanentDelete = (subject) => {
    setConfirmAction({ type: 'permanentDelete', id: subject.id, title: subject.title });
  };

  const handleRestore = (id) => {
    restoreSubject(userKey, id);
    reload();
  };

  const confirmExecute = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'recycle') {
      recycleSubject(userKey, confirmAction.id);
    } else if (confirmAction.type === 'permanentDelete') {
      permanentlyDeleteSubject(userKey, confirmAction.id);
    }
    reload();
    setConfirmAction(null);
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-500 mt-1">Manage your study subjects</p>
        </div>
        <div className="flex gap-2">
          {recycleBin.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowRecycleBin((v) => !v)}>
              <Archive className="w-4 h-4" />
              Bin ({recycleBin.length})
            </Button>
          )}
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Recycle Bin */}
      {showRecycleBin && recycleBin.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/30">
          <div className="px-6 py-3 border-b border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Recycle Bin</h3>
            </div>
            <button onClick={() => setShowRecycleBin(false)} className="text-gray-400 hover:text-gray-600">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <CardBody>
            <div className="space-y-2">
              {recycleBin.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{subject.title}</p>
                    <p className="text-xs text-gray-400">
                      Deleted {new Date(subject.deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleRestore(subject.id)}>
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePermanentDelete(subject)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Subject Cards */}
      {subjects.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects yet</h3>
            <p className="text-gray-500 text-sm mb-4">Add your first subject to start planning</p>
            <Button onClick={openAdd}><Plus className="w-4 h-4" /> Add Subject</Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const daysLeft = Math.ceil((new Date(subject.deadline) - new Date()) / 86400000);
            const isOverdue = daysLeft < 0;
            return (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{subject.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${priorityBadge[subject.priority]}`}>
                      {subject.priority}
                    </span>
                  </div>
                  {subject.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{subject.description}</p>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {subject.startDate && (
                        <><span>{new Date(subject.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span><span>→</span></>
                      )}
                      <span>{new Date(subject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        {isOverdue ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                      </span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{subject.hoursPerDay || 2}h/day</span>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t border-gray-100 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(subject)}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRecycle(subject)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" id="title" placeholder="e.g. Mathematics" value={form.title} onChange={(e) => update('title', e.target.value)} required />
          <Textarea label="Description" id="description" placeholder="Course details, syllabus, chapters..." value={form.description} onChange={(e) => update('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" id="startDate" type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
            <Input label="Deadline" id="deadline" type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" id="priority" value={form.priority} onChange={(e) => update('priority', e.target.value)} options={priorityOptions} />
            <Select label="Study Hours / Day" id="hoursPerDay" value={form.hoursPerDay} onChange={(e) => update('hoursPerDay', e.target.value)}
              options={[
                { value: '1', label: '1 hour' }, { value: '2', label: '2 hours' }, { value: '3', label: '3 hours' },
                { value: '4', label: '4 hours' }, { value: '5', label: '5 hours' }, { value: '6', label: '6 hours' },
              ]} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editingId ? 'Save Changes' : 'Add Subject'}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === 'recycle' ? 'Move to Recycle Bin?' : 'Delete Permanently?'}>
        <div className="text-center py-4">
          <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
            confirmAction?.type === 'permanentDelete' ? 'bg-red-100' : 'bg-orange-100'
          }`}>
            <AlertTriangle className={`w-7 h-7 ${
              confirmAction?.type === 'permanentDelete' ? 'text-red-600' : 'text-orange-600'
            }`} />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {confirmAction?.type === 'recycle'
              ? `Delete "${confirmAction?.title}"?`
              : `Permanently delete "${confirmAction?.title}"?`}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {confirmAction?.type === 'recycle'
              ? 'This will move the subject to the recycle bin. Its study plan will be hidden but you can restore it later.'
              : 'This will permanently delete the subject, all its study plan tasks, and progress. This cannot be undone.'}
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmAction(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === 'permanentDelete' ? 'danger' : 'primary'}
              onClick={confirmExecute}
              className="flex-1"
            >
              {confirmAction?.type === 'recycle' ? 'Move to Bin' : 'Delete Forever'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
