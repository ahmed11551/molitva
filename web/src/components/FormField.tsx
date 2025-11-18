import { ReactNode } from 'react';
import './FormField.css';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}

export default function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''}`}>
      <label htmlFor={htmlFor} className="form-field-label">
        {label}
        {required && <span className="form-field-required">*</span>}
      </label>
      <div className="form-field-input">{children}</div>
      {error && <div className="form-field-error-text">{error}</div>}
      {hint && !error && <div className="form-field-hint">{hint}</div>}
    </div>
  );
}

