import { useState, type FormEvent } from 'react';
import {
  aggregateByProject,
  computeHourlyEarnings,
  computeRangeEarnings,
  endOfDay,
  formatClockTime,
  formatCurrencyTotals,
  formatDuration,
  formatMoney,
  formatShortDuration,
  getEffectiveRate,
  getEntriesInRange,
  getEntryOverlapSeconds,
  hasAnyEarnings,
  startOfDay,
  toDateTimeLocalValue,
} from '../lib/timeUtils';
import type { ManualEntryInput } from '../hooks/useTimelyData';
import type { Project, Task, TimeEntry } from '../types/models';

interface DailyViewProps {
  selectedDate: Date;
  projects: readonly Project[];
  tasks: readonly Task[];
  entries: readonly TimeEntry[];
  projectsById: ReadonlyMap<string, Project>;
  tasksById: ReadonlyMap<string, Task>;
  now: Date;
  onAddManualEntry: (input: ManualEntryInput) => Promise<void>;
  onUpdateEntry: (entryId: string, input: ManualEntryInput) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onStartTimer: (projectId: string, taskId: string) => Promise<void>;
  onStopTimer: (entry: TimeEntry) => Promise<void>;
}

export function DailyView({
  selectedDate,
  projects,
  tasks,
  entries,
  projectsById,
  tasksById,
  now,
  onAddManualEntry,
  onUpdateEntry,
  onDeleteEntry,
  onStartTimer,
  onStopTimer,
}: DailyViewProps) {
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  const range = { start: dayStart, end: dayEnd };

  const dayEntries = getEntriesInRange(entries, range, now);
  const projectSummaries = aggregateByProject(entries, projectsById, tasksById, range, now);
  const totalSeconds = projectSummaries.reduce((sum, p) => sum + p.seconds, 0);
  const dayEarnings = computeRangeEarnings(entries, projectsById, tasksById, range, now);

  const activeProjects = projects.filter((p) => !p.archived);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProjectId, setManualProjectId] = useState('');
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editNote, setEditNote] = useState('');

  function openManualForm() {
    const firstProj = activeProjects[0];
    const projId = firstProj?.id ?? '';
    const firstTask = tasks.find((t) => t.projectId === projId && !t.archived);
    const defaultStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      9,
      0,
    );
    const defaultEnd = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      10,
      0,
    );
    setManualProjectId(projId);
    setManualTaskId(firstTask?.id ?? '');
    setManualStart(toDateTimeLocalValue(defaultStart));
    setManualEnd(toDateTimeLocalValue(defaultEnd));
    setManualNote('');
    setFormError(null);
    setShowManualForm(true);
  }

  const manualTasks = tasks.filter(
    (t) => t.projectId === manualProjectId && !t.archived,
  );

  async function handleCreateManual(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!manualProjectId || !manualTaskId) {
      setFormError('Select a project and a task.');
      return;
    }
    const start = new Date(manualStart);
    const end = new Date(manualEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setFormError('End time must be after start time.');
      return;
    }
    await onAddManualEntry({
      projectId: manualProjectId,
      taskId: manualTaskId,
      note: manualNote,
      startTime: start,
      endTime: end,
    });
    setShowManualForm(false);
  }

  function startEditing(entry: TimeEntry) {
    setEditingId(entry.id);
    setEditStart(toDateTimeLocalValue(entry.startTime));
    setEditEnd(toDateTimeLocalValue(entry.endTime ?? now));
    setEditNote(entry.note);
  }

  async function saveEdit(entry: TimeEntry) {
    const start = new Date(editStart);
    const end = new Date(editEnd);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return;
    }
    await onUpdateEntry(entry.id, {
      projectId: entry.projectId,
      taskId: entry.taskId,
      note: editNote,
      startTime: start,
      endTime: end,
    });
    setEditingId(null);
  }

  return (
    <div className="view-stack">
      <div className="summary-banner">
        <div className="summary-metrics">
          <div>
            <div className="metric-label">Total Tracked</div>
            <div className="metric-value">{formatDuration(totalSeconds)}</div>
          </div>
          {hasAnyEarnings(dayEarnings) && (
            <div className="metric-divider">
              <div className="metric-label">Real-Time Earnings</div>
              <div className="metric-value earnings-value">
                {formatCurrencyTotals(dayEarnings)}
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={openManualForm}
          disabled={activeProjects.length === 0}
        >
          + Manual Entry
        </button>
      </div>

      {showManualForm && (
        <form className="panel-card manual-form" onSubmit={handleCreateManual}>
          <div className="panel-card-header">
            <h3>Add Manual Entry</h3>
            <button
              type="button"
              className="btn-icon-text"
              onClick={() => setShowManualForm(false)}
            >
              Cancel
            </button>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Project</span>
              <select
                className="text-input"
                value={manualProjectId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setManualProjectId(pid);
                  const first = tasks.find((t) => t.projectId === pid && !t.archived);
                  setManualTaskId(first?.id ?? '');
                }}
              >
                {activeProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Task</span>
              <select
                className="text-input"
                value={manualTaskId}
                onChange={(e) => setManualTaskId(e.target.value)}
              >
                {manualTasks.length === 0 && <option value="">No tasks in project</option>}
                {manualTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Start</span>
              <input
                type="datetime-local"
                className="text-input"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
              />
            </label>

            <label className="field">
              <span>End</span>
              <input
                type="datetime-local"
                className="text-input"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
              />
            </label>
          </div>

          <label className="field">
            <span>Note (optional)</span>
            <input
              type="text"
              className="text-input"
              maxLength={500}
              placeholder="What did you work on?"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
            />
          </label>

          {formError && <p className="error-banner">{formError}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-sm">
              Save Entry
            </button>
          </div>
        </form>
      )}

      {projectSummaries.length > 0 && (
        <div className="panel-card">
          <h3>By Project</h3>
          <div className="breakdown-list">
            {projectSummaries.map((item) => (
              <div key={item.projectId} className="breakdown-row">
                <div className="breakdown-meta">
                  <span className="project-chip">
                    <span className="color-dot" style={{ backgroundColor: item.color }} />
                    {item.projectName}
                  </span>
                  <span className="mono-dim">
                    {formatShortDuration(item.seconds)} ({Math.round(item.percentage)}%)
                    {hasAnyEarnings(item.earnings) && (
                      <span className="earnings-inline">
                        {' '}
                        · {formatCurrencyTotals(item.earnings)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.max(2, item.percentage)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="panel-card">
        <h3>Entries ({dayEntries.length})</h3>
        {dayEntries.length === 0 ? (
          <p className="empty-hint">No time tracked on this day yet.</p>
        ) : (
          <ul className="entry-list">
            {dayEntries.map((entry) => {
              const task = tasksById.get(entry.taskId);
              const resolvedProjectId = task?.projectId ?? entry.projectId;
              const project = projectsById.get(resolvedProjectId);
              const secs = getEntryOverlapSeconds(entry, dayStart, dayEnd, now);
              const rate = getEffectiveRate(task, project);
              const isEditing = editingId === entry.id;

              const sessionEarningLabel =
                rate?.mode === 'hourly'
                  ? formatMoney(computeHourlyEarnings(secs, rate.amount), rate.currency)
                  : rate?.mode === 'fixed'
                    ? `${formatMoney(rate.amount, rate.currency)} fixed`
                    : null;

              if (isEditing) {
                return (
                  <li key={entry.id} className="entry-row entry-editing">
                    <div className="form-grid">
                      <label className="field">
                        <span>Start</span>
                        <input
                          type="datetime-local"
                          className="text-input input-sm"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                        />
                      </label>
                      <label className="field">
                        <span>End</span>
                        <input
                          type="datetime-local"
                          className="text-input input-sm"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      className="text-input input-sm"
                      placeholder="Note…"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                    <div className="entry-edit-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => void saveEdit(entry)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </li>
                );
              }

              return (
                <li key={entry.id} className="entry-row">
                  <div className="entry-main">
                    <div className="entry-title-line">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: project?.color ?? '#64748b' }}
                      />
                      <strong>{task?.title ?? 'Unknown Task'}</strong>
                      <span className="entry-project-label">
                        {project?.name ?? 'Unknown Project'}
                      </span>
                      {entry.endTime === null && <span className="live-pill">LIVE</span>}
                    </div>
                    {entry.note && <div className="entry-note">{entry.note}</div>}
                    <div className="entry-time-range">
                      {formatClockTime(entry.startTime)} –{' '}
                      {entry.endTime ? formatClockTime(entry.endTime) : 'now'}
                    </div>
                  </div>

                  <div className="entry-right">
                    <div className="entry-duration-row">
                      <span className="entry-duration">{formatDuration(secs)}</span>
                      {sessionEarningLabel && (
                        <span className="earnings-inline">{sessionEarningLabel}</span>
                      )}
                    </div>
                    <div className="entry-actions">
                      {entry.endTime === null ? (
                        <button
                          type="button"
                          className="btn btn-stop btn-xs"
                          onClick={() => void onStopTimer(entry)}
                        >
                          Stop
                        </button>
                      ) : (
                        <>
                          {task && !task.archived && (
                            <button
                              type="button"
                              className="btn-icon-text"
                              onClick={() => void onStartTimer(resolvedProjectId, task.id)}
                              title="Start tracking this task again"
                            >
                              ▶ Again
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-icon-text"
                            onClick={() => startEditing(entry)}
                          >
                            Edit
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn-icon-text danger"
                        onClick={() => void onDeleteEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
