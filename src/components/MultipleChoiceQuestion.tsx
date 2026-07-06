type MultipleChoiceQuestionProps = {
  name: string;
  options: string[];
  value: string[];
  maxSelections?: number;
  otherValue?: string;
  onChange: (value: string[]) => void;
  onOtherChange?: (value: string) => void;
};

export function MultipleChoiceQuestion({
  name,
  options,
  value,
  maxSelections,
  otherValue = "",
  onChange,
  onOtherChange,
}: MultipleChoiceQuestionProps) {
  function toggleOption(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((selected) => selected !== option));
      return;
    }

    if (maxSelections && value.length >= maxSelections) {
      return;
    }

    onChange([...value, option]);
  }

  const limitReached = Boolean(maxSelections && value.length >= maxSelections);
  const showOtherInput = value.includes("Other") && onOtherChange;

  return (
    <div>
      <div className="option-grid">
        {options.map((option) => {
          const checked = value.includes(option);
          const disabled = !checked && limitReached;
          return (
            <label className={`choice-option ${disabled ? "is-disabled" : ""}`} key={option}>
              <input
                type="checkbox"
                name={name}
                value={option}
                checked={checked}
                disabled={disabled}
                onChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
      {showOtherInput ? (
        <label className="other-field">
          <span>Please tell us more</span>
          <input
            type="text"
            value={otherValue}
            onChange={(event) => onOtherChange(event.target.value)}
            placeholder="Type your answer"
          />
        </label>
      ) : null}
    </div>
  );
}
