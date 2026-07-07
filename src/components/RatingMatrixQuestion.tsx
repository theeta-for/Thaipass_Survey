import type { OptionGroup } from "../types";

type RatingMatrixQuestionProps = {
  items: string[];
  value: Record<string, string | number>;
  minLabel: string;
  maxLabel: string;
  scaleOptions?: string[];
  itemGroups?: OptionGroup[];
  onChange: (item: string, rating: string | number) => void;
};

function RatingRow({
  item,
  options,
  value,
  hasTextOptions,
  onChange,
}: {
  item: string;
  options: Array<string | number>;
  value: Record<string, string | number>;
  hasTextOptions: boolean;
  onChange: (item: string, rating: string | number) => void;
}) {
  return (
    <div className="rating-row">
      <span className="rating-item">{item}</span>
      <div className={`rating-options ${hasTextOptions ? "has-text-options" : ""}`} role="radiogroup" aria-label={item}>
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
  );
}

export function RatingMatrixQuestion({
  items,
  value,
  minLabel,
  maxLabel,
  scaleOptions,
  itemGroups,
  onChange,
}: RatingMatrixQuestionProps) {
  const options = scaleOptions ?? [1, 2, 3, 4, 5];
  const groupedItems = itemGroups?.length ? itemGroups : [{ label: "", options: items }];

  return (
    <div className="rating-matrix">
      <div className="rating-scale-labels">
        <span>{scaleOptions ? minLabel : `1 = ${minLabel}`}</span>
        <span>{scaleOptions ? maxLabel : `5 = ${maxLabel}`}</span>
      </div>
      {groupedItems.map((group) => (
        <div className="rating-group" key={group.label || "rating-items"}>
          {group.label ? <h3>{group.label}</h3> : null}
          <div className="rating-group-rows">
            {group.options.map((item) => (
              <RatingRow
                key={item}
                item={item}
                options={options}
                value={value}
                hasTextOptions={Boolean(scaleOptions)}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
