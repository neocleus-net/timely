import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { BillingMode, Currency, Project, Task, TimeEntry } from '../types/models';

function readString(data: DocumentData, field: string, fallback = ''): string {
  const val: unknown = data[field];
  return typeof val === 'string' ? val : fallback;
}

function readBoolean(data: DocumentData, field: string, fallback = false): boolean {
  const val: unknown = data[field];
  return typeof val === 'boolean' ? val : fallback;
}

function readNullableNumber(data: DocumentData, field: string): number | null {
  const val: unknown = data[field];
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

function readCurrency(data: DocumentData, field: string): Currency {
  const val: unknown = data[field];
  return val === 'INR' ? 'INR' : 'USD';
}

function readBillingMode(data: DocumentData, field: string): BillingMode {
  const val: unknown = data[field];
  if (val === 'hourly' || val === 'fixed') return val;
  return 'none';
}

function readDate(data: DocumentData, field: string): Date {
  const val: unknown = data[field];
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return new Date();
}

function readNullableDate(data: DocumentData, field: string): Date | null {
  const val: unknown = data[field];
  if (val instanceof Timestamp) {
    return val.toDate();
  }
  return null;
}

function parseProject(snap: QueryDocumentSnapshot<DocumentData>): Project {
  const data = snap.data();
  return {
    id: snap.id,
    name: readString(data, 'name', 'Untitled Project'),
    color: readString(data, 'color', '#2563eb'),
    archived: readBoolean(data, 'archived', false),
    createdAt: readDate(data, 'createdAt'),
    hourlyRate: readNullableNumber(data, 'hourlyRate'),
    currency: readCurrency(data, 'currency'),
  };
}

function parseTask(snap: QueryDocumentSnapshot<DocumentData>): Task {
  const data = snap.data();
  return {
    id: snap.id,
    projectId: readString(data, 'projectId'),
    title: readString(data, 'title', 'Untitled Task'),
    archived: readBoolean(data, 'archived', false),
    createdAt: readDate(data, 'createdAt'),
    billingMode: readBillingMode(data, 'billingMode'),
    rate: readNullableNumber(data, 'rate'),
    currency: readCurrency(data, 'currency'),
  };
}

function parseTimeEntry(snap: QueryDocumentSnapshot<DocumentData>): TimeEntry {
  const data = snap.data();
  return {
    id: snap.id,
    projectId: readString(data, 'projectId'),
    taskId: readString(data, 'taskId'),
    note: readString(data, 'note'),
    startTime: readDate(data, 'startTime'),
    endTime: readNullableDate(data, 'endTime'),
    durationSec: readNullableNumber(data, 'durationSec'),
  };
}

export interface CreateProjectInput {
  name: string;
  color: string;
  hourlyRate: number | null;
  currency: Currency;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  billingMode: BillingMode;
  rate: number | null;
  currency: Currency;
}

export interface UpdateTaskInput {
  projectId: string;
  title: string;
  billingMode: BillingMode;
  rate: number | null;
  currency: Currency;
}

export interface ManualEntryInput {
  projectId: string;
  taskId: string;
  note: string;
  startTime: Date;
  endTime: Date;
}

export interface TimelyDataState {
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  activeEntries: TimeEntry[];
  projectsById: Map<string, Project>;
  tasksById: Map<string, Task>;
  loading: boolean;
  error: string | null;
  createProject: (input: CreateProjectInput) => Promise<string | null>;
  updateProjectRate: (
    projectId: string,
    hourlyRate: number | null,
    currency: Currency,
  ) => Promise<void>;
  toggleArchiveProject: (project: Project) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<string | null>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  toggleArchiveTask: (task: Task) => Promise<void>;
  startTimer: (projectId: string, taskId: string, note?: string) => Promise<void>;
  stopTimer: (entry: TimeEntry) => Promise<void>;
  stopAllTimers: () => Promise<void>;
  updateEntryNote: (entryId: string, note: string) => Promise<void>;
  addManualEntry: (input: ManualEntryInput) => Promise<void>;
  updateTimeEntry: (entryId: string, input: ManualEntryInput) => Promise<void>;
  deleteTimeEntry: (entryId: string) => Promise<void>;
}

export function useTimelyData(uid: string | null): TimelyDataState {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loadedFlags, setLoadedFlags] = useState({ p: false, t: false, e: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProjects([]);
      setTasks([]);
      setEntries([]);
      setLoadedFlags({ p: false, t: false, e: false });
      return;
    }

    setError(null);
    const onErr = (err: Error) => {
      setError(err.message);
    };

    const projectsQ = query(
      collection(db, 'users', uid, 'projects'),
      orderBy('createdAt', 'asc'),
    );
    const tasksQ = query(
      collection(db, 'users', uid, 'tasks'),
      orderBy('createdAt', 'asc'),
    );
    const entriesQ = query(
      collection(db, 'users', uid, 'timeEntries'),
      orderBy('startTime', 'desc'),
    );

    const unsubProjects = onSnapshot(
      projectsQ,
      (snap) => {
        setProjects(snap.docs.map(parseProject));
        setLoadedFlags((prev) => ({ ...prev, p: true }));
      },
      onErr,
    );

    const unsubTasks = onSnapshot(
      tasksQ,
      (snap) => {
        setTasks(snap.docs.map(parseTask));
        setLoadedFlags((prev) => ({ ...prev, t: true }));
      },
      onErr,
    );

    const unsubEntries = onSnapshot(
      entriesQ,
      (snap) => {
        setEntries(snap.docs.map(parseTimeEntry));
        setLoadedFlags((prev) => ({ ...prev, e: true }));
      },
      onErr,
    );

    return () => {
      unsubProjects();
      unsubTasks();
      unsubEntries();
    };
  }, [uid]);

  const activeEntries = useMemo(
    () => entries.filter((entry) => entry.endTime === null),
    [entries],
  );

  const projectsById = useMemo(
    () => new Map<string, Project>(projects.map((p) => [p.id, p])),
    [projects],
  );

  const tasksById = useMemo(
    () => new Map<string, Task>(tasks.map((t) => [t.id, t])),
    [tasks],
  );

  const createProject = useCallback(
    async (input: CreateProjectInput): Promise<string | null> => {
      if (!uid) return null;
      const trimmed = input.name.trim();
      if (!trimmed) return null;
      const cleanRate =
        input.hourlyRate !== null && Number.isFinite(input.hourlyRate) && input.hourlyRate >= 0
          ? input.hourlyRate
          : null;
      const ref = await addDoc(collection(db, 'users', uid, 'projects'), {
        name: trimmed.slice(0, 80),
        color: input.color,
        archived: false,
        createdAt: Timestamp.now(),
        hourlyRate: cleanRate,
        currency: input.currency,
      });
      return ref.id;
    },
    [uid],
  );

  const updateProjectRate = useCallback(
    async (projectId: string, hourlyRate: number | null, currency: Currency): Promise<void> => {
      if (!uid) return;
      const cleanRate =
        hourlyRate !== null && Number.isFinite(hourlyRate) && hourlyRate >= 0 ? hourlyRate : null;
      await updateDoc(doc(db, 'users', uid, 'projects', projectId), {
        hourlyRate: cleanRate,
        currency,
      });
    },
    [uid],
  );

  const toggleArchiveProject = useCallback(
    async (project: Project): Promise<void> => {
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid, 'projects', project.id), {
        archived: !project.archived,
      });
    },
    [uid],
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<string | null> => {
      if (!uid) return null;
      const trimmed = input.title.trim();
      if (!trimmed || !input.projectId) return null;
      const hasRate = input.billingMode !== 'none';
      const cleanRate =
        hasRate && input.rate !== null && Number.isFinite(input.rate) && input.rate >= 0
          ? input.rate
          : null;
      const billingMode: BillingMode = cleanRate === null ? 'none' : input.billingMode;

      const ref = await addDoc(collection(db, 'users', uid, 'tasks'), {
        projectId: input.projectId,
        title: trimmed.slice(0, 120),
        archived: false,
        createdAt: Timestamp.now(),
        billingMode,
        rate: cleanRate,
        currency: input.currency,
      });
      return ref.id;
    },
    [uid],
  );

  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput): Promise<void> => {
      if (!uid) return;
      const trimmed = input.title.trim();
      if (!trimmed || !input.projectId) return;
      const hasRate = input.billingMode !== 'none';
      const cleanRate =
        hasRate && input.rate !== null && Number.isFinite(input.rate) && input.rate >= 0
          ? input.rate
          : null;
      const billingMode: BillingMode = cleanRate === null ? 'none' : input.billingMode;

      await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
        projectId: input.projectId,
        title: trimmed.slice(0, 120),
        billingMode,
        rate: cleanRate,
        currency: input.currency,
      });
    },
    [uid],
  );

  const toggleArchiveTask = useCallback(
    async (task: Task): Promise<void> => {
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid, 'tasks', task.id), {
        archived: !task.archived,
      });
    },
    [uid],
  );

  const startTimer = useCallback(
    async (projectId: string, taskId: string, note = ''): Promise<void> => {
      if (!uid) return;
      await addDoc(collection(db, 'users', uid, 'timeEntries'), {
        projectId,
        taskId,
        note: note.trim().slice(0, 500),
        startTime: Timestamp.now(),
        endTime: null,
        durationSec: null,
      });
    },
    [uid],
  );

  const stopTimer = useCallback(
    async (entry: TimeEntry): Promise<void> => {
      if (!uid) return;
      const endMs = Math.max(Date.now(), entry.startTime.getTime());
      const durationSec = Math.max(0, Math.floor((endMs - entry.startTime.getTime()) / 1000));
      await updateDoc(doc(db, 'users', uid, 'timeEntries', entry.id), {
        endTime: Timestamp.fromMillis(endMs),
        durationSec,
      });
    },
    [uid],
  );

  const stopAllTimers = useCallback(async (): Promise<void> => {
    if (!uid || activeEntries.length === 0) return;
    const batch = writeBatch(db);
    const nowMs = Date.now();
    for (const entry of activeEntries) {
      const endMs = Math.max(nowMs, entry.startTime.getTime());
      const durationSec = Math.max(0, Math.floor((endMs - entry.startTime.getTime()) / 1000));
      batch.update(doc(db, 'users', uid, 'timeEntries', entry.id), {
        endTime: Timestamp.fromMillis(endMs),
        durationSec,
      });
    }
    await batch.commit();
  }, [uid, activeEntries]);

  const updateEntryNote = useCallback(
    async (entryId: string, note: string): Promise<void> => {
      if (!uid) return;
      await updateDoc(doc(db, 'users', uid, 'timeEntries', entryId), {
        note: note.trim().slice(0, 500),
      });
    },
    [uid],
  );

  const addManualEntry = useCallback(
    async (input: ManualEntryInput): Promise<void> => {
      if (!uid) return;
      const startMs = input.startTime.getTime();
      const endMs = Math.max(startMs, input.endTime.getTime());
      const durationSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
      await addDoc(collection(db, 'users', uid, 'timeEntries'), {
        projectId: input.projectId,
        taskId: input.taskId,
        note: input.note.trim().slice(0, 500),
        startTime: Timestamp.fromMillis(startMs),
        endTime: Timestamp.fromMillis(endMs),
        durationSec,
      });
    },
    [uid],
  );

  const updateTimeEntry = useCallback(
    async (entryId: string, input: ManualEntryInput): Promise<void> => {
      if (!uid) return;
      const startMs = input.startTime.getTime();
      const endMs = Math.max(startMs, input.endTime.getTime());
      const durationSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
      await updateDoc(doc(db, 'users', uid, 'timeEntries', entryId), {
        projectId: input.projectId,
        taskId: input.taskId,
        note: input.note.trim().slice(0, 500),
        startTime: Timestamp.fromMillis(startMs),
        endTime: Timestamp.fromMillis(endMs),
        durationSec,
      });
    },
    [uid],
  );

  const deleteTimeEntry = useCallback(
    async (entryId: string): Promise<void> => {
      if (!uid) return;
      await deleteDoc(doc(db, 'users', uid, 'timeEntries', entryId));
    },
    [uid],
  );

  const loading = Boolean(uid) && !(loadedFlags.p && loadedFlags.t && loadedFlags.e);

  return {
    projects,
    tasks,
    entries,
    activeEntries,
    projectsById,
    tasksById,
    loading,
    error,
    createProject,
    updateProjectRate,
    toggleArchiveProject,
    createTask,
    updateTask,
    toggleArchiveTask,
    startTimer,
    stopTimer,
    stopAllTimers,
    updateEntryNote,
    addManualEntry,
    updateTimeEntry,
    deleteTimeEntry,
  };
}
