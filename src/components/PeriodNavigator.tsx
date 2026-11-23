import type { ViewPeriod } from '../types/models';

interface PeriodNavigatorProps {
  period: ViewPeriod;
  heading: string;
  onChangePeriod: (period: ViewPeriod) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onExportCsv: () => void;
}

const PERIOD_TABS: readonly { id: ViewPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'custom', label: 'Custom' },
];

export function PeriodNavigator({
  period,
  heading,
  onChangePeriod,
  onPrev,
  onNext,
  onToday,
  onExportCsv,
}: PeriodNavigatorProps) {
  return (
    <div className="period-nav">
      <div className="period-tabs" role="tablist" aria-label="Time view">
        {PERIOD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={period === tab.id}
            className={`period-tab ${period === tab.id ? 'active' : ''}`}
            onClick={() => onChangePeriod(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="period-controls">
        {period !== 'custom' && (
          <div className="date-stepper">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onPrev} aria-label="Previous">
              ←
            </button>
            <span className="period-heading">{heading}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onNext} aria-label="Next">
              →
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onToday}>
              Today
            </button>
          </div>
        )}

        <button type="button" className="btn btn-ghost btn-sm" onClick={onExportCsv}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
