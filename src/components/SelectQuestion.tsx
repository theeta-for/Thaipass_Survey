type SelectQuestionProps = {
  name: string;
  options: string[];
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
};

export function SelectQuestion({ name, options, placeholder = "Select one", value = "", onChange }: SelectQuestionProps) {
  return (
    <label className="select-field">
      <span className="sr-only">{placeholder}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
