import {
  aggregateByDay,
  aggregateByProject,
  aggregateByTask,
  computeRangeEarnings,
  endOfMonth,
  formatCurrencyTotals,
  formatDuration,
  formatShortDuration,
  hasAnyEarnings,
  startOfMonth,
} from '../lib/timeUtils';
import type { Project, Task, TimeEntry } from '../types/models';

interface MonthlyViewProps {
  anchorDate: Date;
  entries: readonly TimeEntry[];
  projectsById: ReadonlyMap<string, Project>;
  tasksById: ReadonlyMap<string, Task>;
  now: Date;
}

export function MonthlyView({
  anchorDate,
  entries,
  projectsById,
  tasksById,
  now,
}: MonthlyViewProps) {
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(anchorDate);
  const range = { start: monthStart, end: monthEnd };

  const buckets = aggregateByDay(entries, range, now, tasksById, (d) => String(d.getDate()));
  const projectSummaries = aggregateByProject(entries, projectsById, tasksById, range, now);
  const taskSummaries = aggregateByTask(entries, projectsById, tasksById, range, now);
  const monthEarnings = computeRangeEarnings(entries, projectsById, tasksById, range, now);

  const totalSeconds = projectSummaries.reduce((sum, p) => sum + p.seconds, 0);
  const activeDays = buckets.filter((b) => b.totalSeconds > 0).length;
  const maxDaySeconds = Math.max(3600, ...buckets.map((b) => b.totalSeconds));

  return (
    <div className="view-stack">
      <div className="summary-banner">
        <div className="summary-metrics">
          <div>
            <div className="metric-label">Monthly Total</div>
            <div className="metric-value">{formatDuration(totalSeconds)}</div>
          </div>
          {hasAnyEarnings(monthEarnings) && (
            <div className="metric-divider">
              <div className="metric-label">Monthly Earnings</div>
              <div className="metric-value earnings-value">
                {formatCurrencyTotals(monthEarnings)}
              </div>
            </div>
          )}
        </div>
        <div className="metric-sub">
          Active Days: <strong>{activeDays}</strong> / {buckets.length}
        </div>
      </div>

      <div className="panel-card">
        <h3>Day-of-Month Activity</h3>
        <div className="month-chart">
          {buckets.map((bucket) => {
            const heightPct = (bucket.totalSeconds / maxDaySeconds) * 100;
            const segments = Object.entries(bucket.byProject);
            return (
              <div
                key={bucket.key}
                className="month-col"
                title={`${bucket.key}: ${formatShortDuration(bucket.totalSeconds)}`}
              >
                <div className="month-bar-wrap">
                  <div
                    className="chart-bar-stack"
                    style={{
                      height: `${Math.max(bucket.totalSeconds > 0 ? 5 : 0, heightPct)}%`,
                    }}
                  >
                    {segments.map(([projectId, secs]) => {
                      const project = projectsById.get(projectId);
                      const segPct =
                        bucket.totalSeconds > 0 ? (secs / bucket.totalSeconds) * 100 : 0;
                      return (
                        <div
                          key={projectId}
                          className="chart-segment"
                          style={{
                            height: `${segPct}%`,
                            backgroundColor: project?.color ?? '#64748b',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="month-day-num">{bucket.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="panel-card">
          <h3>Projects</h3>
          {projectSummaries.length === 0 ? (
            <p className="empty-hint">No time tracked this month.</p>
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
            <p className="empty-hint">No tasks recorded this month.</p>
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
