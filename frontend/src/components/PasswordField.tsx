import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  minLength?: number;
};

/** Reusable password input with show / hide toggle. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  required,
  placeholder = "••••••••",
  hint,
  minLength,
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-field">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          minLength={minLength}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
