type ProgressBarProps = {
  answered: number;
  total: number;
};

export function ProgressBar({ answered, total }: ProgressBarProps) {
  const percentage = total ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="progress-card" aria-label={`Survey progress ${percentage}%`}>
      <div className="progress-copy">
        <span>Progress</span>
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
