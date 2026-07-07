type RatingScaleQuestionProps = {
  name: string;
  value?: number;
  minLabel: string;
  maxLabel: string;
  onChange: (value: number) => void;
};

export function RatingScaleQuestion({ name, value, minLabel, maxLabel, onChange }: RatingScaleQuestionProps) {
  return (
    <div className="rating-scale-question">
      <div className="rating-scale-labels">
        <span>1 = {minLabel}</span>
        <span>5 = {maxLabel}</span>
      </div>
      <div className="rating-scale-options" role="radiogroup" aria-label={name}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <label className={value === rating ? "is-selected" : ""} key={rating}>
            <input
              type="radio"
              name={name}
              checked={value === rating}
              onChange={() => onChange(rating)}
            />
            <span>{rating}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
