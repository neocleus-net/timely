import type {
  Currency,
  CurrencyTotals,
  DateRange,
  DayBucket,
  EffectiveRate,
  Project,
  ProjectSummary,
  Task,
  TaskSummary,
  TimeEntry,
  WeeklyMatrixRow,
} from '../types/models';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function emptyCurrencyTotals(): CurrencyTotals {
  return { USD: 0, INR: 0 };
}

export function addToCurrencyTotals(
  target: CurrencyTotals,
  currency: Currency,
  amount: number,
): void {
  if (!Number.isFinite(amount) || amount <= 0) return;
  target[currency] += amount;
}

export function mergeCurrencyTotals(
  target: CurrencyTotals,
  source: CurrencyTotals,
): void {
  target.USD += source.USD;
  target.INR += source.INR;
}

export function hasAnyEarnings(totals: CurrencyTotals): boolean {
  return totals.USD > 0 || totals.INR > 0;
}

export function formatMoney(amount: number, currency: Currency): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return currency === 'INR' ? inrFormatter.format(safe) : usdFormatter.format(safe);
}

export function formatCurrencyTotals(totals: CurrencyTotals): string {
  const parts: string[] = [];
  if (totals.USD > 0) parts.push(formatMoney(totals.USD, 'USD'));
  if (totals.INR > 0) parts.push(formatMoney(totals.INR, 'INR'));
  if (parts.length === 0) return '$0.00';
  return parts.join(' + ');
}

export function getEffectiveRate(
  task: Task | undefined,
  project: Project | undefined,
): EffectiveRate | null {
  if (task && task.billingMode === 'hourly' && task.rate !== null && task.rate >= 0) {
    return {
      mode: 'hourly',
      amount: task.rate,
      currency: task.currency,
      inherited: false,
    };
  }
  if (task && task.billingMode === 'fixed' && task.rate !== null && task.rate >= 0) {
    return {
      mode: 'fixed',
      amount: task.rate,
      currency: task.currency,
      inherited: false,
    };
  }
  if (project && project.hourlyRate !== null && project.hourlyRate >= 0) {
    return {
      mode: 'hourly',
      amount: project.hourlyRate,
      currency: project.currency,
      inherited: true,
    };
  }
  return null;
}

export function formatRateLabel(rate: EffectiveRate | null): string | null {
  if (!rate) return null;
  if (rate.mode === 'fixed') {
    return `${formatMoney(rate.amount, rate.currency)} / task`;
  }
  if (rate.mode === 'hourly') {
    return `${formatMoney(rate.amount, rate.currency)}/hr${rate.inherited ? ' (proj)' : ''}`;
  }
  return null;
}

export function computeHourlyEarnings(seconds: number, hourlyRate: number): number {
  if (seconds <= 0 || hourlyRate <= 0) return 0;
  return (seconds / 3600) * hourlyRate;
}

export function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0');
}

export function formatDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function formatShortDuration(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  if (clamped === 0) return '0m';
  if (clamped < 60) return '<1m';
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1, 0, 0, 0, 0);
}

/** Monday 00:00:00.000 of the week containing `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = startOfDay(date);
  const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  return addDays(d, diffToMonday);
}

/** Exclusive end of the Monday–Sunday week (next Monday 00:00:00.000). */
export function endOfWeekMonday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 7);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/** Exclusive end of the month (1st of next month 00:00:00.000). */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0);
}

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const parts = key.split('-').map((p) => Number.parseInt(p, 10));
  const year = parts[0] ?? new Date().getFullYear();
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function toDateTimeLocalValue(date: Date): string {
  return `${toDateKey(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDayHeading(date: Date): string {
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatWeekHeading(weekStart: Date): string {
  const weekEndInclusive = addDays(weekStart, 6);
  const startText = weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const endText = weekEndInclusive.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startText} – ${endText}`;
}

export function formatMonthHeading(monthStart: Date): string {
  return monthStart.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

export function getEntryElapsedSeconds(entry: TimeEntry, now: Date): number {
  const endMs = entry.endTime ? entry.endTime.getTime() : now.getTime();
  return Math.max(0, Math.floor((endMs - entry.startTime.getTime()) / 1000));
}

/**
 * Computes how many seconds of `entry` fall inside `[rangeStart, rangeEnd)`.
 * Correctly splits entries that cross midnight or period boundaries.
 */
export function getEntryOverlapSeconds(
  entry: TimeEntry,
  rangeStart: Date,
  rangeEnd: Date,
  now: Date,
): number {
  const entryStartMs = entry.startTime.getTime();
  const entryEndMs = entry.endTime ? entry.endTime.getTime() : now.getTime();
  if (entryEndMs <= entryStartMs) return 0;

  const overlapStart = Math.max(entryStartMs, rangeStart.getTime());
  const overlapEnd = Math.min(entryEndMs, rangeEnd.getTime());
  if (overlapEnd <= overlapStart) return 0;

  return Math.floor((overlapEnd - overlapStart) / 1000);
}

export function getEntriesInRange(
  entries: readonly TimeEntry[],
  range: DateRange,
  now: Date,
): TimeEntry[] {
  return entries.filter(
    (entry) =>
      getEntryOverlapSeconds(entry, range.start, range.end, now) > 0 ||
      (entry.endTime === null &&
        entry.startTime.getTime() >= range.start.getTime() &&
        entry.startTime.getTime() < range.end.getTime()),
  );
}

export function getDaysInRange(range: DateRange): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(range.start);
  const endMs = range.end.getTime();
  while (cursor.getTime() < endMs) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function aggregateByTask(
  entries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  range: DateRange,
  now: Date,
): TaskSummary[] {
  const totals = new Map<string, { projectId: string; seconds: number }>();
  let grandTotal = 0;

  for (const entry of entries) {
    const secs = getEntryOverlapSeconds(entry, range.start, range.end, now);
    if (secs <= 0) continue;
    const task = tasksById.get(entry.taskId);
    const resolvedProjectId = task?.projectId ?? entry.projectId;
    const prev = totals.get(entry.taskId);
    totals.set(entry.taskId, {
      projectId: resolvedProjectId,
      seconds: (prev?.seconds ?? 0) + secs,
    });
    grandTotal += secs;
  }

  const summaries: TaskSummary[] = [];
  for (const [taskId, info] of totals.entries()) {
    const task = tasksById.get(taskId);
    const project = projectsById.get(info.projectId);
    const effectiveRate = getEffectiveRate(task, project);
    const earnings = emptyCurrencyTotals();

    if (effectiveRate) {
      if (effectiveRate.mode === 'hourly') {
        addToCurrencyTotals(
          earnings,
          effectiveRate.currency,
          computeHourlyEarnings(info.seconds, effectiveRate.amount),
        );
      } else if (effectiveRate.mode === 'fixed') {
        addToCurrencyTotals(earnings, effectiveRate.currency, effectiveRate.amount);
      }
    }

    summaries.push({
      taskId,
      taskTitle: task?.title ?? 'Unknown Task',
      projectId: info.projectId,
      projectName: project?.name ?? 'Unknown Project',
      color: project?.color ?? '#64748b',
      seconds: info.seconds,
      percentage: grandTotal > 0 ? (info.seconds / grandTotal) * 100 : 0,
      earnings,
      effectiveRate,
    });
  }

  summaries.sort((a, b) => b.seconds - a.seconds);
  return summaries;
}

export function aggregateByProject(
  entries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  range: DateRange,
  now: Date,
): ProjectSummary[] {
  const taskSummaries = aggregateByTask(entries, projectsById, tasksById, range, now);
  const byProject = new Map<string, { seconds: number; earnings: CurrencyTotals }>();
  let grandTotal = 0;

  for (const ts of taskSummaries) {
    const prev = byProject.get(ts.projectId) ?? {
      seconds: 0,
      earnings: emptyCurrencyTotals(),
    };
    prev.seconds += ts.seconds;
    mergeCurrencyTotals(prev.earnings, ts.earnings);
    byProject.set(ts.projectId, prev);
    grandTotal += ts.seconds;
  }

  const summaries: ProjectSummary[] = [];
  for (const [projectId, info] of byProject.entries()) {
    const project = projectsById.get(projectId);
    summaries.push({
      projectId,
      projectName: project?.name ?? 'Unknown Project',
      color: project?.color ?? '#64748b',
      seconds: info.seconds,
      percentage: grandTotal > 0 ? (info.seconds / grandTotal) * 100 : 0,
      earnings: info.earnings,
    });
  }

  summaries.sort((a, b) => b.seconds - a.seconds);
  return summaries;
}

export function computeRangeEarnings(
  entries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  range: DateRange,
  now: Date,
): CurrencyTotals {
  const totals = emptyCurrencyTotals();
  const taskSummaries = aggregateByTask(entries, projectsById, tasksById, range, now);
  for (const ts of taskSummaries) {
    mergeCurrencyTotals(totals, ts.earnings);
  }
  return totals;
}

export function computeActiveEarnings(
  activeEntries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  now: Date,
): CurrencyTotals {
  const totals = emptyCurrencyTotals();
  const countedFixedTasks = new Set<string>();

  for (const entry of activeEntries) {
    const task = tasksById.get(entry.taskId);
    const project = projectsById.get(task?.projectId ?? entry.projectId);
    const rate = getEffectiveRate(task, project);
    if (!rate) continue;
    if (rate.mode === 'hourly') {
      const secs = getEntryElapsedSeconds(entry, now);
      addToCurrencyTotals(totals, rate.currency, computeHourlyEarnings(secs, rate.amount));
    } else if (rate.mode === 'fixed' && !countedFixedTasks.has(entry.taskId)) {
      countedFixedTasks.add(entry.taskId);
      addToCurrencyTotals(totals, rate.currency, rate.amount);
    }
  }

  return totals;
}

export function aggregateByDay(
  entries: readonly TimeEntry[],
  range: DateRange,
  now: Date,
  tasksById?: ReadonlyMap<string, Task>,
  labelFormatter?: (d: Date) => string,
): DayBucket[] {
  const days = getDaysInRange(range);
  return days.map((dayStart) => {
    const dayEnd = addDays(dayStart, 1);
    const byProject: Record<string, number> = {};
    let totalSeconds = 0;

    for (const entry of entries) {
      const secs = getEntryOverlapSeconds(entry, dayStart, dayEnd, now);
      if (secs <= 0) continue;
      const projectId = tasksById?.get(entry.taskId)?.projectId ?? entry.projectId;
      byProject[projectId] = (byProject[projectId] ?? 0) + secs;
      totalSeconds += secs;
    }

    return {
      date: dayStart,
      key: toDateKey(dayStart),
      label: labelFormatter
        ? labelFormatter(dayStart)
        : dayStart.toLocaleDateString([], { weekday: 'short' }),
      totalSeconds,
      byProject,
    };
  });
}

export function buildWeeklyMatrix(
  entries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  weekStart: Date,
  now: Date,
): WeeklyMatrixRow[] {
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rowMap = new Map<string, WeeklyMatrixRow>();

  for (const entry of entries) {
    for (let i = 0; i < days.length; i += 1) {
      const dayStart = days[i];
      if (!dayStart) continue;
      const dayEnd = addDays(dayStart, 1);
      const secs = getEntryOverlapSeconds(entry, dayStart, dayEnd, now);
      if (secs <= 0) continue;

      let row = rowMap.get(entry.taskId);
      if (!row) {
        const task = tasksById.get(entry.taskId);
        const projectId = task?.projectId ?? entry.projectId;
        const project = projectsById.get(projectId);
        row = {
          taskId: entry.taskId,
          taskTitle: task?.title ?? 'Unknown Task',
          projectId,
          projectName: project?.name ?? 'Unknown Project',
          color: project?.color ?? '#64748b',
          dailySeconds: [0, 0, 0, 0, 0, 0, 0],
          totalSeconds: 0,
          earnings: emptyCurrencyTotals(),
        };
        rowMap.set(entry.taskId, row);
      }

      row.dailySeconds[i] = (row.dailySeconds[i] ?? 0) + secs;
      row.totalSeconds += secs;
    }
  }

  for (const row of rowMap.values()) {
    const task = tasksById.get(row.taskId);
    const project = projectsById.get(row.projectId);
    const rate = getEffectiveRate(task, project);
    if (rate) {
      if (rate.mode === 'hourly') {
        addToCurrencyTotals(
          row.earnings,
          rate.currency,
          computeHourlyEarnings(row.totalSeconds, rate.amount),
        );
      } else if (rate.mode === 'fixed') {
        addToCurrencyTotals(row.earnings, rate.currency, rate.amount);
      }
    }
  }

  return Array.from(rowMap.values()).sort((a, b) => b.totalSeconds - a.totalSeconds);
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildEntriesCsv(
  entries: readonly TimeEntry[],
  projectsById: ReadonlyMap<string, Project>,
  tasksById: ReadonlyMap<string, Task>,
  range: DateRange,
  now: Date,
): string {
  const header = [
    'Project',
    'Task',
    'Start',
    'End',
    'Duration (seconds)',
    'Duration (HH:MM:SS)',
    'Billing Mode',
    'Rate',
    'Currency',
    'Session Earnings',
    'Note',
  ];
  const rows: string[] = [header.join(',')];

  const relevant = entries
    .filter((entry) => getEntryOverlapSeconds(entry, range.start, range.end, now) > 0)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  for (const entry of relevant) {
    const secs = getEntryOverlapSeconds(entry, range.start, range.end, now);
    const task = tasksById.get(entry.taskId);
    const project = projectsById.get(task?.projectId ?? entry.projectId);
    const rate = getEffectiveRate(task, project);

    const sessionEarnings =
      rate?.mode === 'hourly'
        ? computeHourlyEarnings(secs, rate.amount).toFixed(2)
        : rate?.mode === 'fixed'
          ? 'Fixed per task'
          : '';

    const cells = [
      project?.name ?? 'Unknown Project',
      task?.title ?? 'Unknown Task',
      entry.startTime.toISOString(),
      entry.endTime ? entry.endTime.toISOString() : 'Running',
      String(secs),
      formatDuration(secs),
      rate?.mode ?? 'none',
      rate ? String(rate.amount) : '',
      rate?.currency ?? '',
      sessionEarnings,
      entry.note,
    ];
    rows.push(cells.map(escapeCsvCell).join(','));
  }

  return rows.join('\n');
}
