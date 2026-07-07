import type { OptionGroup } from "../types";

type RatingMatrixQuestionProps = {
  items: string[];
  value: Record<string, string | number>;
  minLabel: string;
  maxLabel: string;
  scaleOptions?: string[];
  itemGroups?: OptionGroup[];
  getLabel?: (text: string) => string;
  onChange: (item: string, rating: string | number) => void;
};

function RatingRow({
  item,
  options,
  value,
  hasTextOptions,
  getLabel,
  onChange,
}: {
  item: string;
  options: Array<string | number>;
  value: Record<string, string | number>;
  hasTextOptions: boolean;
  getLabel: (text: string) => string;
  onChange: (item: string, rating: string | number) => void;
}) {
  return (
    <div className="rating-row">
      <span className="rating-item">{getLabel(item)}</span>
      <div className={`rating-options ${hasTextOptions ? "has-text-options" : ""}`} role="radiogroup" aria-label={getLabel(item)}>
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
  getLabel = (text) => text,
  onChange,
}: RatingMatrixQuestionProps) {
  const options = scaleOptions ?? [1, 2, 3, 4, 5];
  const groupedItems = itemGroups?.length ? itemGroups : [{ label: "", options: items }];

  return (
    <div className="rating-matrix">
      <div className="rating-scale-labels">
        <span>{scaleOptions ? getLabel(minLabel) : `1 = ${getLabel(minLabel)}`}</span>
        <span>{scaleOptions ? getLabel(maxLabel) : `5 = ${getLabel(maxLabel)}`}</span>
      </div>
      {groupedItems.map((group) => (
        <div className="rating-group" key={group.label || "rating-items"}>
          {group.label ? <h3>{getLabel(group.label)}</h3> : null}
          <div className="rating-group-rows">
            {group.options.map((item) => (
              <RatingRow
                key={item}
                item={item}
                options={options}
                value={value}
                hasTextOptions={Boolean(scaleOptions)}
                getLabel={getLabel}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
