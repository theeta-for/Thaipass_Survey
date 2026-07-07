import type { OptionGroup } from "../types";

type SelectQuestionProps = {
  name: string;
  options: string[];
  optionGroups?: OptionGroup[];
  label?: string;
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
};

export function SelectQuestion({
  name,
  options,
  optionGroups,
  label = "Select an answer",
  placeholder = "Select one",
  value = "",
  onChange,
}: SelectQuestionProps) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select name={name} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
          {placeholder}
        </option>
        {optionGroups?.length
          ? optionGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
      </select>
    </label>
  );
}
