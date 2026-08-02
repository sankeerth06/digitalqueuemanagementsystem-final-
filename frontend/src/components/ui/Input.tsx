import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="label-text">
            {label}
          </label>
        )}
        <input ref={ref} id={id} className={clsx('input-field', error && 'border-coral-500', className)} {...props} />
        {error && <p className="mt-1 text-xs text-coral-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
