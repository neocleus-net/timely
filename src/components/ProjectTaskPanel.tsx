import { useState, type FormEvent } from 'react';
import {
  formatDuration,
  formatMoney,
  formatRateLabel,
  getEffectiveRate,
  getEntryElapsedSeconds,
} from '../lib/timeUtils';
import type {
  CreateProjectInput,
  CreateTaskInput,
  UpdateTaskInput,
} from '../hooks/useTimelyData';
import {
  PROJECT_COLORS,
  type BillingMode,
  type Currency,
  type Project,
  type Task,
  type TimeEntry,
} from '../types/models';

interface TaskDraft {
  title: string;
  billingMode: BillingMode;
  rateText: string;
  currency: Currency;
}

interface ProjectTaskPanelProps {
  projects: readonly Project[];
  tasks: readonly Task[];
  entries: readonly TimeEntry[];
  activeEntries: readonly TimeEntry[];
  now: Date;
  onCreateProject: (input: CreateProjectInput) => Promise<string | null>;
  onUpdateProjectRate: (
    projectId: string,
    hourlyRate: number | null,
    currency: Currency,
  ) => Promise<void>;
  onToggleArchiveProject: (project: Project) => Promise<void>;
  onCreateTask: (input: CreateTaskInput) => Promise<string | null>;
  onUpdateTask: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  onToggleArchiveTask: (task: Task) => Promise<void>;
  onStartTimer: (projectId: string, taskId: string) => Promise<void>;
  onStopTimer: (entry: TimeEntry) => Promise<void>;
}

function parseOptionalRate(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function ProjectTaskPanel({
  projects,
  tasks,
  entries,
  activeEntries,
  now,
  onCreateProject,
  onUpdateProjectRate,
  onToggleArchiveProject,
  onCreateTask,
  onUpdateTask,
  onToggleArchiveTask,
  onStartTimer,
  onStopTimer,
}: ProjectTaskPanelProps) {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState<string>(PROJECT_COLORS[0] ?? '#2563eb');
  const [newProjectRate, setNewProjectRate] = useState('');
  const [newProjectCurrency, setNewProjectCurrency] = useState<Currency>('USD');
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskDraft>>({});
  const [showArchived, setShowArchived] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskProjectId, setEditTaskProjectId] = useState('');
  const [editTaskBillingMode, setEditTaskBillingMode] = useState<BillingMode>('none');
  const [editTaskRateText, setEditTaskRateText] = useState('');
  const [editTaskCurrency, setEditTaskCurrency] = useState<Currency>('USD');

  const [editingProjectRateId, setEditingProjectRateId] = useState<string | null>(null);
  const [editProjectRateText, setEditProjectRateText] = useState('');
  const [editProjectCurrency, setEditProjectCurrency] = useState<Currency>('USD');

  const visibleProjects = projects.filter((p) => showArchived || !p.archived);
  const activeProjects = projects.filter((p) => !p.archived);

  const activeByTaskId = new Map<string, TimeEntry>();
  for (const entry of activeEntries) {
    if (!activeByTaskId.has(entry.taskId)) {
      activeByTaskId.set(entry.taskId, entry);
    }
  }

  const sessionCountByTaskId = new Map<string, number>();
  for (const entry of entries) {
    sessionCountByTaskId.set(entry.taskId, (sessionCountByTaskId.get(entry.taskId) ?? 0) + 1);
  }

  function getTaskDraft(project: Project): TaskDraft {
    return (
      taskDrafts[project.id] ?? {
        title: '',
        billingMode: 'none',
        rateText: '',
        currency: project.currency,
      }
    );
  }

  function updateTaskDraft(project: Project, patch: Partial<TaskDraft>) {
    setTaskDrafts((prev) => ({
      ...prev,
      [project.id]: { ...getTaskDraft(project), ...patch },
    }));
  }

  async function handleAddProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newProjectName.trim() || creatingProject) return;
    setCreatingProject(true);
    try {
      await onCreateProject({
        name: newProjectName,
        color: newProjectColor,
        hourlyRate: parseOptionalRate(newProjectRate),
        currency: newProjectCurrency,
      });
      setNewProjectName('');
      setNewProjectRate('');
      const nextIdx = (projects.length + 1) % PROJECT_COLORS.length;
      setNewProjectColor(PROJECT_COLORS[nextIdx] ?? '#2563eb');
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleAddTask(e: FormEvent<HTMLFormElement>, project: Project) {
    e.preventDefault();
    const draft = getTaskDraft(project);
    const title = draft.title.trim();
    if (!title) return;

    const rate = draft.billingMode === 'none' ? null : parseOptionalRate(draft.rateText);
    await onCreateTask({
      projectId: project.id,
      title,
      billingMode: rate === null ? 'none' : draft.billingMode,
      rate,
      currency: draft.currency,
    });
    updateTaskDraft(project, { title: '', billingMode: 'none', rateText: '' });
  }

  function beginEditTask(task: Task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskProjectId(task.projectId);
    setEditTaskBillingMode(task.billingMode);
    setEditTaskRateText(task.rate !== null ? String(task.rate) : '');
    setEditTaskCurrency(task.currency);
  }

  async function saveEditTask(taskId: string) {
    const title = editTaskTitle.trim();
    if (!title || !editTaskProjectId) return;
    const rate =
      editTaskBillingMode === 'none' ? null : parseOptionalRate(editTaskRateText);
    await onUpdateTask(taskId, {
      projectId: editTaskProjectId,
      title,
      billingMode: rate === null ? 'none' : editTaskBillingMode,
      rate,
      currency: editTaskCurrency,
    });
    setEditingTaskId(null);
  }

  function beginEditProjectRate(project: Project) {
    setEditingProjectRateId(project.id);
    setEditProjectRateText(project.hourlyRate !== null ? String(project.hourlyRate) : '');
    setEditProjectCurrency(project.currency);
  }

  async function saveEditProjectRate(projectId: string) {
    await onUpdateProjectRate(
      projectId,
      parseOptionalRate(editProjectRateText),
      editProjectCurrency,
    );
    setEditingProjectRateId(null);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Projects &amp; Tasks</h2>
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>Archived</span>
        </label>
      </div>

      <form className="new-project-form" onSubmit={handleAddProject}>
        <input
          type="text"
          className="text-input"
          placeholder="New project name…"
          value={newProjectName}
          maxLength={80}
          onChange={(e) => setNewProjectName(e.target.value)}
        />

        <div className="rate-inline-row">
          <select
            className="text-input input-sm currency-select"
            aria-label="Project currency"
            value={newProjectCurrency}
            onChange={(e) => setNewProjectCurrency(e.target.value === 'INR' ? 'INR' : 'USD')}
          >
            <option value="USD">USD ($)</option>
            <option value="INR">INR (₹)</option>
          </select>
          <input
            type="number"
            min="0"
            step="any"
            className="text-input input-sm"
            placeholder="Default /hr rate (optional)"
            value={newProjectRate}
            onChange={(e) => setNewProjectRate(e.target.value)}
          />
        </div>

        <div className="color-picker-row">
          <div className="color-swatches" role="radiogroup" aria-label="Project color">
            {PROJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch ${newProjectColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
                onClick={() => setNewProjectColor(color)}
              />
            ))}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!newProjectName.trim() || creatingProject}
          >
            + Project
          </button>
        </div>
      </form>

      <div className="project-list">
        {visibleProjects.length === 0 && (
          <p className="empty-hint">
            Create your first project above, then add tasks with optional hourly or per-task
            rates.
          </p>
        )}

        {visibleProjects.map((project) => {
          const projectTasks = tasks.filter(
            (t) => t.projectId === project.id && (showArchived || !t.archived),
          );
          const draft = getTaskDraft(project);
          const isEditingProjRate = editingProjectRateId === project.id;

          return (
            <div
              key={project.id}
              className={`project-card ${project.archived ? 'is-archived' : ''}`}
            >
              <div className="project-card-header">
                <div className="project-name-row">
                  <span className="color-dot" style={{ backgroundColor: project.color }} />
                  <span className="project-name">{project.name}</span>
                  {project.hourlyRate !== null && !isEditingProjRate && (
                    <span className="rate-badge">
                      {formatMoney(project.hourlyRate, project.currency)}/hr
                    </span>
                  )}
                </div>
                <div className="project-header-actions">
                  {!project.archived && !isEditingProjRate && (
                    <button
                      type="button"
                      className="btn-icon-text"
                      onClick={() => beginEditProjectRate(project)}
                      title="Set project default hourly rate"
                    >
                      Rate
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon-text"
                    onClick={() => onToggleArchiveProject(project)}
                    title={project.archived ? 'Restore project' : 'Archive project'}
                  >
                    {project.archived ? 'Restore' : 'Archive'}
                  </button>
                </div>
              </div>

              {isEditingProjRate && (
                <div className="inline-edit-box">
                  <div className="rate-inline-row">
                    <select
                      className="text-input input-sm currency-select"
                      value={editProjectCurrency}
                      onChange={(e) =>
                        setEditProjectCurrency(e.target.value === 'INR' ? 'INR' : 'USD')
                      }
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="text-input input-sm"
                      placeholder="Hourly rate (blank = none)"
                      value={editProjectRateText}
                      onChange={(e) => setEditProjectRateText(e.target.value)}
                    />
                  </div>
                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => void saveEditProjectRate(project.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => setEditingProjectRateId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <ul className="task-list">
                {projectTasks.map((task) => {
                  const runningEntry = activeByTaskId.get(task.id);
                  const isRunning = Boolean(runningEntry);
                  const isEditing = editingTaskId === task.id;
                  const effectiveRate = getEffectiveRate(task, project);
                  const rateLabel = formatRateLabel(effectiveRate);
                  const sessions = sessionCountByTaskId.get(task.id) ?? 0;

                  if (isEditing) {
                    return (
                      <li key={task.id} className="task-row task-editing">
                        <input
                          type="text"
                          className="text-input input-sm"
                          value={editTaskTitle}
                          maxLength={120}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          placeholder="Task title"
                        />

                        <label className="mini-field">
                          <span>Linked Project</span>
                          <select
                            className="text-input input-sm"
                            value={editTaskProjectId}
                            onChange={(e) => setEditTaskProjectId(e.target.value)}
                          >
                            {activeProjects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="rate-inline-row">
                          <select
                            className="text-input input-sm"
                            value={editTaskBillingMode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditTaskBillingMode(
                                val === 'hourly' || val === 'fixed' ? val : 'none',
                              );
                            }}
                          >
                            <option value="none">Inherit / No rate</option>
                            <option value="hourly">Per Hour</option>
                            <option value="fixed">Per Task (Fixed)</option>
                          </select>
                          {editTaskBillingMode !== 'none' && (
                            <>
                              <select
                                className="text-input input-sm currency-select-xs"
                                value={editTaskCurrency}
                                onChange={(e) =>
                                  setEditTaskCurrency(e.target.value === 'INR' ? 'INR' : 'USD')
                                }
                              >
                                <option value="USD">$</option>
                                <option value="INR">₹</option>
                              </select>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="text-input input-sm"
                                placeholder="Rate"
                                value={editTaskRateText}
                                onChange={(e) => setEditTaskRateText(e.target.value)}
                              />
                            </>
                          )}
                        </div>

                        <div className="inline-edit-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => void saveEditTask(task.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setEditingTaskId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={task.id}
                      className={`task-row ${isRunning ? 'is-running' : ''} ${
                        task.archived ? 'is-archived' : ''
                      }`}
                    >
                      <div className="task-info">
                        <span className="task-title">{task.title}</span>
                        <div className="task-meta-line">
                          {rateLabel && <span className="rate-badge">{rateLabel}</span>}
                          {sessions > 0 && (
                            <span className="session-count">
                              {sessions} {sessions === 1 ? 'run' : 'runs'}
                            </span>
                          )}
                          {runningEntry && (
                            <span className="task-live-time">
                              {formatDuration(getEntryElapsedSeconds(runningEntry, now))}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="task-actions">
                        {!task.archived && (
                          <button
                            type="button"
                            className={`btn btn-xs ${isRunning ? 'btn-stop' : 'btn-start'}`}
                            onClick={() => {
                              if (runningEntry) {
                                void onStopTimer(runningEntry);
                              } else {
                                void onStartTimer(project.id, task.id);
                              }
                            }}
                          >
                            {isRunning ? 'Stop' : 'Start'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-icon-text"
                          onClick={() => beginEditTask(task)}
                          title="Edit task, rate, or linked project"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-icon-text"
                          onClick={() => onToggleArchiveTask(task)}
                          title={task.archived ? 'Restore task' : 'Archive task'}
                        >
                          {task.archived ? 'Restore' : '×'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {!project.archived && (
                <form
                  className="new-task-form-stack"
                  onSubmit={(e) => handleAddTask(e, project)}
                >
                  <div className="new-task-form">
                    <input
                      type="text"
                      className="text-input input-sm"
                      placeholder="Add task…"
                      maxLength={120}
                      value={draft.title}
                      onChange={(e) => updateTaskDraft(project, { title: e.target.value })}
                    />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-xs"
                      disabled={!draft.title.trim()}
                    >
                      Add
                    </button>
                  </div>

                  {draft.title.trim().length > 0 && (
                    <div className="rate-inline-row">
                      <select
                        className="text-input input-sm"
                        aria-label="Task billing mode"
                        value={draft.billingMode}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTaskDraft(project, {
                            billingMode:
                              val === 'hourly' || val === 'fixed' ? val : 'none',
                          });
                        }}
                      >
                        <option value="none">Inherit / No rate</option>
                        <option value="hourly">Per Hour</option>
                        <option value="fixed">Per Task</option>
                      </select>

                      {draft.billingMode !== 'none' && (
                        <>
                          <select
                            className="text-input input-sm currency-select-xs"
                            aria-label="Task currency"
                            value={draft.currency}
                            onChange={(e) =>
                              updateTaskDraft(project, {
                                currency: e.target.value === 'INR' ? 'INR' : 'USD',
                              })
                            }
                          >
                            <option value="USD">$</option>
                            <option value="INR">₹</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            className="text-input input-sm"
                            placeholder={draft.billingMode === 'hourly' ? '/hr' : '/task'}
                            value={draft.rateText}
                            onChange={(e) =>
                              updateTaskDraft(project, { rateText: e.target.value })
                            }
                          />
                        </>
                      )}
                    </div>
                  )}
                </form>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
