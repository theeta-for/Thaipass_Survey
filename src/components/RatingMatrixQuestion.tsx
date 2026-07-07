type RatingMatrixQuestionProps = {
  items: string[];
  value: Record<string, string | number>;
  minLabel: string;
  maxLabel: string;
  scaleOptions?: string[];
  onChange: (item: string, rating: string | number) => void;
};

export function RatingMatrixQuestion({
  items,
  value,
  minLabel,
  maxLabel,
  scaleOptions,
  onChange,
}: RatingMatrixQuestionProps) {
  const options = scaleOptions ?? [1, 2, 3, 4, 5];

  return (
    <div className="rating-matrix">
      <div className="rating-scale-labels">
        <span>{scaleOptions ? minLabel : `1 = ${minLabel}`}</span>
        <span>{scaleOptions ? maxLabel : `5 = ${maxLabel}`}</span>
      </div>
      {items.map((item) => (
        <div className="rating-row" key={item}>
          <span className="rating-item">{item}</span>
          <div className={`rating-options ${scaleOptions ? "has-text-options" : ""}`} role="radiogroup" aria-label={item}>
            {options.map((rating) => (
              <label key={rating}>
                <input
                  type="radio"
                  name={item}
                  checked={value[item] === rating}
                  onChange={() => onChange(item, rating)}
                />
                <span>{rating}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
