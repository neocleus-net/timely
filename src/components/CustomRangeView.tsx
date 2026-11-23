import {
  addDays,
  aggregateByProject,
  aggregateByTask,
  computeRangeEarnings,
  formatCurrencyTotals,
  formatDuration,
  formatShortDuration,
  fromDateKey,
  hasAnyEarnings,
  startOfDay,
  toDateKey,
} from '../lib/timeUtils';
import type { DateRange, Project, Task, TimeEntry } from '../types/models';

interface CustomRangeViewProps {
  range: DateRange;
  entries: readonly TimeEntry[];
  projectsById: ReadonlyMap<string, Project>;
  tasksById: ReadonlyMap<string, Task>;
  now: Date;
  onChangeRange: (next: DateRange) => void;
}

export function CustomRangeView({
  range,
  entries,
  projectsById,
  tasksById,
  now,
  onChangeRange,
}: CustomRangeViewProps) {
  const projectSummaries = aggregateByProject(entries, projectsById, tasksById, range, now);
  const taskSummaries = aggregateByTask(entries, projectsById, tasksById, range, now);
  const rangeEarnings = computeRangeEarnings(entries, projectsById, tasksById, range, now);
  const totalSeconds = projectSummaries.reduce((sum, p) => sum + p.seconds, 0);

  const inclusiveEnd = addDays(range.end, -1);

  function applyPreset(days: number) {
    const today = startOfDay(new Date());
    onChangeRange({
      start: addDays(today, -(days - 1)),
      end: addDays(today, 1),
    });
  }

  function applyYearToDate() {
    const today = startOfDay(new Date());
    onChangeRange({
      start: new Date(today.getFullYear(), 0, 1),
      end: addDays(today, 1),
    });
  }

  return (
    <div className="view-stack">
      <div className="panel-card custom-controls">
        <div className="preset-row">
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => applyPreset(7)}>
            Last 7 Days
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => applyPreset(30)}>
            Last 30 Days
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => applyPreset(90)}>
            Last 90 Days
          </button>
          <button type="button" className="btn btn-ghost btn-xs" onClick={applyYearToDate}>
            This Year
          </button>
        </div>

        <div className="date-range-inputs">
          <label className="field-inline">
            <span>From</span>
            <input
              type="date"
              className="text-input input-sm"
              value={toDateKey(range.start)}
              onChange={(e) => {
                if (!e.target.value) return;
                const nextStart = fromDateKey(e.target.value);
                const nextEnd = nextStart >= range.end ? addDays(nextStart, 1) : range.end;
                onChangeRange({ start: nextStart, end: nextEnd });
              }}
            />
          </label>

          <label className="field-inline">
            <span>To</span>
            <input
              type="date"
              className="text-input input-sm"
              value={toDateKey(inclusiveEnd)}
              onChange={(e) => {
                if (!e.target.value) return;
                const nextEndExclusive = addDays(fromDateKey(e.target.value), 1);
                const nextStart =
                  nextEndExclusive <= range.start
                    ? addDays(nextEndExclusive, -1)
                    : range.start;
                onChangeRange({ start: nextStart, end: nextEndExclusive });
              }}
            />
          </label>
        </div>
      </div>

      <div className="summary-banner">
        <div className="summary-metrics">
          <div>
            <div className="metric-label">Range Total</div>
            <div className="metric-value">{formatDuration(totalSeconds)}</div>
          </div>
          {hasAnyEarnings(rangeEarnings) && (
            <div className="metric-divider">
              <div className="metric-label">Range Earnings</div>
              <div className="metric-value earnings-value">
                {formatCurrencyTotals(rangeEarnings)}
              </div>
            </div>
          )}
        </div>
        <div className="metric-sub">
          {projectSummaries.length} {projectSummaries.length === 1 ? 'project' : 'projects'} ·{' '}
          {taskSummaries.length} {taskSummaries.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="panel-card">
          <h3>Projects</h3>
          {projectSummaries.length === 0 ? (
            <p className="empty-hint">No time tracked in this range.</p>
          ) : (
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
          )}
        </div>

        <div className="panel-card">
          <h3>Tasks</h3>
          {taskSummaries.length === 0 ? (
            <p className="empty-hint">No tasks tracked in this range.</p>
          ) : (
            <div className="breakdown-list">
              {taskSummaries.map((item) => (
                <div key={item.taskId} className="breakdown-row">
                  <div className="breakdown-meta">
                    <span>
                      <span className="color-dot" style={{ backgroundColor: item.color }} />{' '}
                      <strong>{item.taskTitle}</strong>{' '}
                      <span className="muted-inline">({item.projectName})</span>
                    </span>
                    <span className="mono-dim">
                      {formatShortDuration(item.seconds)}
                      {hasAnyEarnings(item.earnings) && (
                        <span className="earnings-inline">
                          {' '}
                          · {formatCurrencyTotals(item.earnings)}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
