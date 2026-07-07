type TextQuestionProps = {
  name: string;
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export function TextQuestion({ name, value = "", placeholder = "Type your answer", onChange }: TextQuestionProps) {
  return (
    <label className="text-field">
      <span>Your feedback</span>
      <textarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={5}
      />
    </label>
  );
}
