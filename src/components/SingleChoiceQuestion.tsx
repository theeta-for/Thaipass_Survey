type SingleChoiceQuestionProps = {
  name: string;
  options: string[];
  value?: string;
  onChange: (value: string) => void;
};

export function SingleChoiceQuestion({ name, options, value, onChange }: SingleChoiceQuestionProps) {
  return (
    <div className="option-grid">
      {options.map((option) => (
        <label className="choice-option" key={option}>
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}
