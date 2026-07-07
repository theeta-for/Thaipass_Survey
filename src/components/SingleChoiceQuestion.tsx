type SingleChoiceQuestionProps = {
  name: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
};

export function SingleChoiceQuestion({ name, options, value, onChange }: SingleChoiceQuestionProps) {
  return (
    <div className="option-grid">
      {options.map((option) => {
        const checked = value === option;
        return (
          <label className={`choice-option ${checked ? "is-selected" : ""}`} key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={checked}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
            {checked ? <i aria-hidden="true" /> : null}
          </label>
        );
      })}
    </div>
  );
}
