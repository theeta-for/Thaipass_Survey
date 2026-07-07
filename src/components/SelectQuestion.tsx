import type { OptionGroup } from "../types";

type SelectQuestionProps = {
  name: string;
  options: string[];
  optionGroups?: OptionGroup[];
  label?: string;
  placeholder?: string;
  value?: string;
  getOptionLabel?: (option: string) => string;
  getGroupLabel?: (label: string) => string;
  onChange: (value: string) => void;
};

export function SelectQuestion({
  name,
  options,
  optionGroups,
  label = "Select an answer",
  placeholder = "Select one",
  value = "",
  getOptionLabel = (option) => option,
  getGroupLabel = (groupLabel) => groupLabel,
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
              <optgroup key={group.label} label={getGroupLabel(group.label)}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {getOptionLabel(option)}
                  </option>
                ))}
              </optgroup>
            ))
          : options.map((option) => (
              <option key={option} value={option}>
                {getOptionLabel(option)}
              </option>
            ))}
      </select>
    </label>
  );
}
