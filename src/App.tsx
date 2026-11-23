import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActiveTimersBar } from './components/ActiveTimersBar';
import { AuthScreen } from './components/AuthScreen';
import { BrandLogo } from './components/BrandLogo';
import { CustomRangeView } from './components/CustomRangeView';
import { DailyView } from './components/DailyView';
import { Footer } from './components/Footer';
import { MonthlyView } from './components/MonthlyView';
import { PeriodNavigator } from './components/PeriodNavigator';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { ProjectTaskPanel } from './components/ProjectTaskPanel';
import { TermsOfService } from './components/TermsOfService';
import { WeeklyView } from './components/WeeklyView';
import { useAuth } from './hooks/useAuth';
import { useNow } from './hooks/useNow';
import { useTheme } from './hooks/useTheme';
import { useTimelyData } from './hooks/useTimelyData';
import { USE_EMULATORS } from './lib/firebase';
import {
  addDays,
  addMonths,
  buildEntriesCsv,
  endOfDay,
  endOfMonth,
  endOfWeekMonday,
  formatDayHeading,
  formatMonthHeading,
  formatWeekHeading,
  startOfDay,
  startOfMonth,
  startOfWeekMonday,
  toDateKey,
} from './lib/timeUtils';
import type { DateRange, ViewPeriod } from './types/models';

export function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const authState = useAuth();
  const { theme, toggleTheme } = useTheme();
  const data = useTimelyData(authState.user?.uid ?? null);
  const now = useNow(data.activeEntries.length > 0);

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const navigate = useCallback((to: string) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      setPathname(to);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const [period, setPeriod] = useState<ViewPeriod>('daily');
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    const today = startOfDay(new Date());
    return { start: addDays(today, -6), end: addDays(today, 1) };
  });

  const activeRange: DateRange = useMemo(() => {
    switch (period) {
      case 'daily':
        return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
      case 'weekly':
        return { start: startOfWeekMonday(anchorDate), end: endOfWeekMonday(anchorDate) };
      case 'monthly':
        return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
      case 'custom':
        return customRange;
    }
  }, [period, anchorDate, customRange]);

  const heading = useMemo(() => {
    switch (period) {
      case 'daily':
        return formatDayHeading(anchorDate);
      case 'weekly':
        return formatWeekHeading(startOfWeekMonday(anchorDate));
      case 'monthly':
        return formatMonthHeading(startOfMonth(anchorDate));
      case 'custom':
        return 'Custom Range';
    }
  }, [period, anchorDate]);

  function handlePrev() {
    if (period === 'daily') setAnchorDate((d) => addDays(d, -1));
    else if (period === 'weekly') setAnchorDate((d) => addDays(d, -7));
    else if (period === 'monthly') setAnchorDate((d) => addMonths(d, -1));
  }

  function handleNext() {
    if (period === 'daily') setAnchorDate((d) => addDays(d, 1));
    else if (period === 'weekly') setAnchorDate((d) => addDays(d, 7));
    else if (period === 'monthly') setAnchorDate((d) => addMonths(d, 1));
  }

  function handleToday() {
    setAnchorDate(startOfDay(new Date()));
  }

  function handleExportCsv() {
    const csv = buildEntriesCsv(
      data.entries,
      data.projectsById,
      data.tasksById,
      activeRange,
      now,
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timely-${period}-${toDateKey(activeRange.start)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (pathname === '/privacy' || pathname === '/privacy/') {
    return (
      <PrivacyPolicy
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => navigate('/')}
        onOpenTerms={() => navigate('/terms')}
      />
    );
  }

  if (pathname === '/terms' || pathname === '/terms/') {
    return (
      <TermsOfService
        theme={theme}
        onToggleTheme={toggleTheme}
        onBack={() => navigate('/')}
        onOpenPrivacy={() => navigate('/privacy')}
      />
    );
  }

  if (authState.loading) {
    return (
      <div className="auth-shell">
        <div className="loading-text">Loading Timely…</div>
      </div>
    );
  }

  if (!authState.user) {
    return (
      <AuthScreen
        signingIn={authState.signingIn}
        error={authState.error}
        theme={theme}
        onToggleTheme={toggleTheme}
        onSignIn={authState.signInWithGoogle}
        onOpenPrivacy={() => navigate('/privacy')}
        onOpenTerms={() => navigate('/terms')}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <BrandLogo size={26} />
          <span className="brand">Timely</span>
          {USE_EMULATORS && <span className="env-pill env-local">Local Emulators</span>}
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          {authState.user.photoURL && (
            <img
              src={authState.user.photoURL}
              alt=""
              className="user-avatar"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="user-email">
            {authState.user.email ?? authState.user.displayName ?? 'Signed in'}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void authState.logout()}
          >
            Sign out
          </button>
        </div>
      </header>

      {data.error && <div className="error-banner global-error">{data.error}</div>}

      <div className="workspace-grid">
        <ProjectTaskPanel
          projects={data.projects}
          tasks={data.tasks}
          entries={data.entries}
          activeEntries={data.activeEntries}
          now={now}
          onCreateProject={data.createProject}
          onUpdateProjectRate={data.updateProjectRate}
          onToggleArchiveProject={data.toggleArchiveProject}
          onCreateTask={data.createTask}
          onUpdateTask={data.updateTask}
          onToggleArchiveTask={data.toggleArchiveTask}
          onStartTimer={data.startTimer}
          onStopTimer={data.stopTimer}
        />

        <main className="main-content">
          <ActiveTimersBar
            activeEntries={data.activeEntries}
            projectsById={data.projectsById}
            tasksById={data.tasksById}
            now={now}
            onStopTimer={data.stopTimer}
            onStopAll={data.stopAllTimers}
            onUpdateNote={data.updateEntryNote}
          />

          <PeriodNavigator
            period={period}
            heading={heading}
            onChangePeriod={setPeriod}
            onPrev={handlePrev}
            onNext={handleNext}
            onToday={handleToday}
            onExportCsv={handleExportCsv}
          />

          {data.loading ? (
            <div className="panel-card">
              <p className="empty-hint">Syncing with Firestore…</p>
            </div>
          ) : (
            <>
              {period === 'daily' && (
                <DailyView
                  selectedDate={anchorDate}
                  projects={data.projects}
                  tasks={data.tasks}
                  entries={data.entries}
                  projectsById={data.projectsById}
                  tasksById={data.tasksById}
                  now={now}
                  onAddManualEntry={data.addManualEntry}
                  onUpdateEntry={data.updateTimeEntry}
                  onDeleteEntry={data.deleteTimeEntry}
                  onStartTimer={data.startTimer}
                  onStopTimer={data.stopTimer}
                />
              )}

              {period === 'weekly' && (
                <WeeklyView
                  anchorDate={anchorDate}
                  entries={data.entries}
                  projectsById={data.projectsById}
                  tasksById={data.tasksById}
                  now={now}
                />
              )}

              {period === 'monthly' && (
                <MonthlyView
                  anchorDate={anchorDate}
                  entries={data.entries}
                  projectsById={data.projectsById}
                  tasksById={data.tasksById}
                  now={now}
                />
              )}

              {period === 'custom' && (
                <CustomRangeView
                  range={customRange}
                  entries={data.entries}
                  projectsById={data.projectsById}
                  tasksById={data.tasksById}
                  now={now}
                  onChangeRange={setCustomRange}
                />
              )}
            </>
          )}
        </main>
      </div>

      <Footer
        onOpenPrivacy={() => navigate('/privacy')}
        onOpenTerms={() => navigate('/terms')}
      />
    </div>
  );
}
