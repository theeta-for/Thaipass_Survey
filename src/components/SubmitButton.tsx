type SubmitButtonProps = {
  disabled?: boolean;
  children: string;
};

export function SubmitButton({ disabled, children }: SubmitButtonProps) {
  return (
    <button className="primary-button" type="submit" disabled={disabled}>
      {children}
    </button>
  );
}
