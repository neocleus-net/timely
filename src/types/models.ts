export type Currency = 'USD' | 'INR';

export type BillingMode = 'none' | 'hourly' | 'fixed';

export interface CurrencyTotals {
  USD: number;
  INR: number;
}

export interface EffectiveRate {
  mode: BillingMode;
  amount: number;
  currency: Currency;
  inherited: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: Date;
  hourlyRate: number | null;
  currency: Currency;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  archived: boolean;
  createdAt: Date;
  billingMode: BillingMode;
  rate: number | null;
  currency: Currency;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  taskId: string;
  note: string;
  startTime: Date;
  endTime: Date | null;
  durationSec: number | null;
}

export type ViewPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  color: string;
  seconds: number;
  percentage: number;
  earnings: CurrencyTotals;
}

export interface TaskSummary {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  color: string;
  seconds: number;
  percentage: number;
  earnings: CurrencyTotals;
  effectiveRate: EffectiveRate | null;
}

export interface DayBucket {
  date: Date;
  key: string;
  label: string;
  totalSeconds: number;
  byProject: Record<string, number>;
}

export interface WeeklyMatrixRow {
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  color: string;
  dailySeconds: number[];
  totalSeconds: number;
  earnings: CurrencyTotals;
}

export const PROJECT_COLORS: readonly string[] = [
  '#2563eb',
  '#0d9488',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#059669',
  '#db2777',
  '#4f46e5',
] as const;
