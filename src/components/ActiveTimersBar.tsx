import { useState } from 'react';
import {
  computeActiveEarnings,
  computeHourlyEarnings,
  formatCurrencyTotals,
  formatDuration,
  formatMoney,
  getEffectiveRate,
  getEntryElapsedSeconds,
  hasAnyEarnings,
} from '../lib/timeUtils';
import type { Project, Task, TimeEntry } from '../types/models';

interface ActiveTimersBarProps {
  activeEntries: readonly TimeEntry[];
  projectsById: ReadonlyMap<string, Project>;
  tasksById: ReadonlyMap<string, Task>;
  now: Date;
  onStopTimer: (entry: TimeEntry) => Promise<void>;
  onStopAll: () => Promise<void>;
  onUpdateNote: (entryId: string, note: string) => Promise<void>;
}

export function ActiveTimersBar({
  activeEntries,
  projectsById,
  tasksById,
  now,
  onStopTimer,
  onStopAll,
  onUpdateNote,
}: ActiveTimersBarProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});

  if (activeEntries.length === 0) {
    return (
      <section className="active-bar active-bar-empty">
        <div className="active-bar-empty-text">
          <span className="pulse-dot idle" />
          <span>
            No active timers. Start one or more tasks from the left panel to track time &amp;
            earnings live.
          </span>
        </div>
      </section>
    );
  }

  const liveActiveEarnings = computeActiveEarnings(activeEntries, projectsById, tasksById, now);

  return (
    <section className="active-bar" aria-label="Active running timers">
      <div className="active-bar-header">
        <div className="active-bar-title">
          <span className="pulse-dot running" />
          <strong>
            {activeEntries.length} Active {activeEntries.length === 1 ? 'Timer' : 'Timers'}
          </strong>
          {hasAnyEarnings(liveActiveEarnings) && (
            <span className="earnings-pill">
              Live: {formatCurrencyTotals(liveActiveEarnings)}
            </span>
          )}
        </div>
        {activeEntries.length > 1 && (
          <button type="button" className="btn btn-danger-ghost btn-sm" onClick={onStopAll}>
            Stop All
          </button>
        )}
      </div>

      <div className="active-timers-grid">
        {activeEntries.map((entry) => {
          const task = tasksById.get(entry.taskId);
          const project = projectsById.get(task?.projectId ?? entry.projectId);
          const elapsed = getEntryElapsedSeconds(entry, now);
          const noteValue = draftNotes[entry.id] ?? entry.note;
          const rate = getEffectiveRate(task, project);

          let liveEarningText: string | null = null;
          if (rate?.mode === 'hourly') {
            liveEarningText = formatMoney(
              computeHourlyEarnings(elapsed, rate.amount),
              rate.currency,
            );
          } else if (rate?.mode === 'fixed') {
            liveEarningText = `${formatMoney(rate.amount, rate.currency)} fixed`;
          }

          return (
            <div
              key={entry.id}
              className="active-timer-card"
              style={{ borderLeftColor: project?.color ?? '#2563eb' }}
            >
              <div className="active-timer-top">
                <div className="active-timer-meta">
                  <span className="project-chip">
                    <span
                      className="color-dot"
                      style={{ backgroundColor: project?.color ?? '#2563eb' }}
                    />
                    {project?.name ?? 'Unknown Project'}
                  </span>
                  <span className="active-task-title">{task?.title ?? 'Unknown Task'}</span>
                </div>
                <div className="active-timer-actions">
                  <div className="active-readout-stack">
                    <span className="timer-readout">{formatDuration(elapsed)}</span>
                    {liveEarningText && (
                      <span className="timer-earning-live">{liveEarningText}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn btn-stop btn-sm"
                    onClick={() => onStopTimer(entry)}
                  >
                    Stop
                  </button>
                </div>
              </div>

              <input
                type="text"
                className="inline-note-input"
                placeholder="Add a note for this session…"
                value={noteValue}
                maxLength={500}
                onChange={(e) => {
                  const val = e.target.value;
                  setDraftNotes((prev) => ({ ...prev, [entry.id]: val }));
                }}
                onBlur={() => {
                  const trimmed = (draftNotes[entry.id] ?? entry.note).trim();
                  if (trimmed !== entry.note) {
                    void onUpdateNote(entry.id, trimmed);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
