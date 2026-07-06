type RatingMatrixQuestionProps = {
  items: string[];
  value: Record<string, number>;
  minLabel: string;
  maxLabel: string;
  onChange: (item: string, rating: number) => void;
};

export function RatingMatrixQuestion({
  items,
  value,
  minLabel,
  maxLabel,
  onChange,
}: RatingMatrixQuestionProps) {
  return (
    <div className="rating-matrix">
      <div className="rating-scale-labels">
        <span>1 = {minLabel}</span>
        <span>5 = {maxLabel}</span>
      </div>
      {items.map((item) => (
        <div className="rating-row" key={item}>
          <span className="rating-item">{item}</span>
          <div className="rating-options" role="radiogroup" aria-label={item}>
            {[1, 2, 3, 4, 5].map((rating) => (
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
