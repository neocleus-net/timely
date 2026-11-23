import { describe, expect, it } from 'vitest';
import type { Project, Task, TimeEntry } from '../types/models';
import {
  aggregateByDay,
  aggregateByProject,
  aggregateByTask,
  buildEntriesCsv,
  buildWeeklyMatrix,
  computeRangeEarnings,
  endOfDay,
  formatCurrencyTotals,
  formatDuration,
  formatShortDuration,
  getEntryOverlapSeconds,
  startOfDay,
  startOfWeekMonday,
} from './timeUtils';

const projects: Project[] = [
  {
    id: 'p1',
    name: 'Alpha',
    color: '#2563eb',
    archived: false,
    createdAt: new Date(2026, 0, 1),
    hourlyRate: 100,
    currency: 'USD',
  },
  {
    id: 'p2',
    name: 'Beta',
    color: '#0d9488',
    archived: false,
    createdAt: new Date(2026, 0, 1),
    hourlyRate: 2000,
    currency: 'INR',
  },
];

const tasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Design',
    archived: false,
    createdAt: new Date(2026, 0, 1),
    billingMode: 'none', // inherits $100/hr from Alpha
    rate: null,
    currency: 'USD',
  },
  {
    id: 't2',
    projectId: 'p2',
    title: 'API Milestone',
    archived: false,
    createdAt: new Date(2026, 0, 1),
    billingMode: 'fixed',
    rate: 5000,
    currency: 'INR',
  },
];

const projectsById = new Map<string, Project>(projects.map((p) => [p.id, p]));
const tasksById = new Map<string, Task>(tasks.map((t) => [t.id, t]));

describe('timeUtils', () => {
  it('formats durations accurately', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatShortDuration(0)).toBe('0m');
    expect(formatShortDuration(45)).toBe('<1m');
    expect(formatShortDuration(3600)).toBe('1h');
    expect(formatShortDuration(5400)).toBe('1h 30m');
  });

  it('splits midnight-crossing entries accurately across days', () => {
    const entry: TimeEntry = {
      id: 'e1',
      projectId: 'p1',
      taskId: 't1',
      note: 'Late work',
      startTime: new Date(2026, 10, 23, 23, 0, 0),
      endTime: new Date(2026, 10, 24, 1, 30, 0),
      durationSec: 9000,
    };

    const day1 = new Date(2026, 10, 23);
    const day2 = new Date(2026, 10, 24);
    const now = new Date(2026, 10, 24, 12, 0, 0);

    expect(getEntryOverlapSeconds(entry, startOfDay(day1), endOfDay(day1), now)).toBe(3600);
    expect(getEntryOverlapSeconds(entry, startOfDay(day2), endOfDay(day2), now)).toBe(5400);
  });

  it('tracks concurrent running timers and computes real-time USD + INR earnings', () => {
    const now = new Date(2026, 10, 23, 10, 30, 0);
    const entries: TimeEntry[] = [
      {
        id: 'e1',
        projectId: 'p1',
        taskId: 't1',
        note: '',
        startTime: new Date(2026, 10, 23, 10, 0, 0), // 30m @ $100/hr = $50
        endTime: null,
        durationSec: null,
      },
      {
        id: 'e2',
        projectId: 'p2',
        taskId: 't2',
        note: '',
        startTime: new Date(2026, 10, 23, 10, 15, 0), // fixed ₹5,000
        endTime: null,
        durationSec: null,
      },
    ];

    const range = { start: startOfDay(now), end: endOfDay(now) };
    const byProject = aggregateByProject(entries, projectsById, tasksById, range, now);
    expect(byProject).toHaveLength(2);
    expect(byProject[0]?.projectId).toBe('p1');
    expect(byProject[0]?.seconds).toBe(1800);
    expect(byProject[0]?.earnings.USD).toBeCloseTo(50, 2);
    expect(byProject[1]?.projectId).toBe('p2');
    expect(byProject[1]?.earnings.INR).toBe(5000);

    const byTask = aggregateByTask(entries, projectsById, tasksById, range, now);
    expect(byTask).toHaveLength(2);
    expect(byTask[0]?.taskId).toBe('t1');

    const earnings = computeRangeEarnings(entries, projectsById, tasksById, range, now);
    expect(earnings.USD).toBeCloseTo(50, 2);
    expect(earnings.INR).toBe(5000);
    expect(formatCurrencyTotals(earnings)).toContain('$50.00');
    expect(formatCurrencyTotals(earnings)).toContain('5,000.00');
  });

  it('computes Monday-start weekly buckets and matrix with earnings', () => {
    const monday = startOfWeekMonday(new Date(2026, 10, 25));
    expect(monday.getDay()).toBe(1);
    expect(monday.getDate()).toBe(23);

    const entries: TimeEntry[] = [
      {
        id: 'e1',
        projectId: 'p1',
        taskId: 't1',
        note: 'Mon session',
        startTime: new Date(2026, 10, 23, 9, 0, 0),
        endTime: new Date(2026, 10, 23, 10, 0, 0),
        durationSec: 3600,
      },
      {
        id: 'e2',
        projectId: 'p1',
        taskId: 't1',
        note: 'Wed session',
        startTime: new Date(2026, 10, 25, 14, 0, 0),
        endTime: new Date(2026, 10, 25, 14, 30, 0),
        durationSec: 1800,
      },
    ];

    const now = new Date(2026, 10, 25, 16, 0, 0);
    const range = { start: monday, end: new Date(2026, 10, 30, 0, 0, 0) };
    const buckets = aggregateByDay(entries, range, now, tasksById);
    expect(buckets).toHaveLength(7);
    expect(buckets[0]?.totalSeconds).toBe(3600);
    expect(buckets[2]?.totalSeconds).toBe(1800);

    const matrix = buildWeeklyMatrix(entries, projectsById, tasksById, monday, now);
    expect(matrix).toHaveLength(1);
    expect(matrix[0]?.dailySeconds).toEqual([3600, 0, 1800, 0, 0, 0, 0]);
    expect(matrix[0]?.totalSeconds).toBe(5400);
    expect(matrix[0]?.earnings.USD).toBeCloseTo(150, 2);
  });

  it('exports valid CSV with escaped quotes and rate columns', () => {
    const now = new Date(2026, 10, 23, 12, 0, 0);
    const entries: TimeEntry[] = [
      {
        id: 'e1',
        projectId: 'p1',
        taskId: 't1',
        note: 'Fix "header", align',
        startTime: new Date(2026, 10, 23, 9, 0, 0),
        endTime: new Date(2026, 10, 23, 10, 0, 0),
        durationSec: 3600,
      },
    ];
    const csv = buildEntriesCsv(
      entries,
      projectsById,
      tasksById,
      { start: startOfDay(now), end: endOfDay(now) },
      now,
    );
    expect(csv).toContain('"Fix ""header"", align"');
    expect(csv).toContain('01:00:00');
    expect(csv).toContain('100.00');
  });
});
