type ProgressBarProps = {
  answered: number;
  current: number;
  total: number;
};

export function ProgressBar({ answered, current, total }: ProgressBarProps) {
  const percentage = total ? Math.round((current / total) * 100) : 0;

  return (
    <div className="progress-card" aria-label={`Survey progress ${percentage}%`}>
      <div className="progress-copy">
        <span>Step {current} of {total}</span>
        <strong>
          {answered} of {total} answered
        </strong>
      </div>
      <div className="progress-track">
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
