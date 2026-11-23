import {
  aggregateByDay,
  buildWeeklyMatrix,
  computeRangeEarnings,
  endOfWeekMonday,
  formatCurrencyTotals,
  formatDuration,
  formatShortDuration,
  hasAnyEarnings,
  startOfWeekMonday,
} from '../lib/timeUtils';
import type { Project, Task, TimeEntry } from '../types/models';

interface WeeklyViewProps {
  anchorDate: Date;
  entries: readonly TimeEntry[];
  projectsById: ReadonlyMap<string, Project>;
  tasksById: ReadonlyMap<string, Task>;
  now: Date;
}

export function WeeklyView({
  anchorDate,
  entries,
  projectsById,
  tasksById,
  now,
}: WeeklyViewProps) {
  const weekStart = startOfWeekMonday(anchorDate);
  const weekEnd = endOfWeekMonday(anchorDate);
  const range = { start: weekStart, end: weekEnd };

  const buckets = aggregateByDay(entries, range, now, tasksById);
  const matrix = buildWeeklyMatrix(entries, projectsById, tasksById, weekStart, now);
  const weekEarnings = computeRangeEarnings(entries, projectsById, tasksById, range, now);

  const totalSeconds = buckets.reduce((sum, b) => sum + b.totalSeconds, 0);
  const maxDaySeconds = Math.max(3600, ...buckets.map((b) => b.totalSeconds));

  return (
    <div className="view-stack">
      <div className="summary-banner">
        <div className="summary-metrics">
          <div>
            <div className="metric-label">Weekly Total (Mon–Sun)</div>
            <div className="metric-value">{formatDuration(totalSeconds)}</div>
          </div>
          {hasAnyEarnings(weekEarnings) && (
            <div className="metric-divider">
              <div className="metric-label">Weekly Earnings</div>
              <div className="metric-value earnings-value">
                {formatCurrencyTotals(weekEarnings)}
              </div>
            </div>
          )}
        </div>
        <div className="metric-sub">
          Daily Avg: <strong>{formatShortDuration(Math.round(totalSeconds / 7))}</strong>
        </div>
      </div>

      <div className="panel-card">
        <h3>Daily Distribution</h3>
        <div className="stacked-chart">
          {buckets.map((bucket) => {
            const heightPct = (bucket.totalSeconds / maxDaySeconds) * 100;
            const segments = Object.entries(bucket.byProject);

            return (
              <div key={bucket.key} className="chart-col">
                <div className="chart-value">
                  {bucket.totalSeconds > 0 ? formatShortDuration(bucket.totalSeconds) : ''}
                </div>
                <div className="chart-bar-wrap">
                  <div
                    className="chart-bar-stack"
                    style={{
                      height: `${Math.max(bucket.totalSeconds > 0 ? 4 : 0, heightPct)}%`,
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
                          title={`${project?.name ?? 'Project'}: ${formatShortDuration(secs)}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="chart-label">{bucket.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel-card">
        <h3>Timesheet Matrix</h3>
        {matrix.length === 0 ? (
          <p className="empty-hint">No time tracked during this week.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project / Task</th>
                  {buckets.map((b) => (
                    <th key={b.key} className="num">
                      {b.label}
                    </th>
                  ))}
                  <th className="num">Total</th>
                  {hasAnyEarnings(weekEarnings) && <th className="num">Earned</th>}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.taskId}>
                    <td>
                      <div className="table-task-cell">
                        <span className="color-dot" style={{ backgroundColor: row.color }} />
                        <span>
                          <strong>{row.taskTitle}</strong>{' '}
                          <span className="muted-inline">({row.projectName})</span>
                        </span>
                      </div>
                    </td>
                    {row.dailySeconds.map((secs, idx) => (
                      <td key={idx} className={`num ${secs === 0 ? 'zero-cell' : ''}`}>
                        {secs > 0 ? formatShortDuration(secs) : '–'}
                      </td>
                    ))}
                    <td className="num strong-cell">{formatShortDuration(row.totalSeconds)}</td>
                    {hasAnyEarnings(weekEarnings) && (
                      <td className="num earnings-inline">
                        {hasAnyEarnings(row.earnings)
                          ? formatCurrencyTotals(row.earnings)
                          : '–'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>
                    <strong>Daily Totals</strong>
                  </td>
                  {buckets.map((b) => (
                    <td key={b.key} className="num strong-cell">
                      {b.totalSeconds > 0 ? formatShortDuration(b.totalSeconds) : '–'}
                    </td>
                  ))}
                  <td className="num strong-cell">{formatShortDuration(totalSeconds)}</td>
                  {hasAnyEarnings(weekEarnings) && (
                    <td className="num strong-cell earnings-inline">
                      {formatCurrencyTotals(weekEarnings)}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
