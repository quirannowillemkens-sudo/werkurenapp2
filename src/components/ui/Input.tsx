import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error, 
    helperText, 
    icon,
    fullWidth = true,
    className = '',
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random()}`;

    return (
      <div className={`flex flex-col gap-2 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label 
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-2.5 text-base rounded-lg border-2 transition-all duration-200
              focus:outline-none focus:ring-0 
              ${icon ? 'pl-10' : ''}
              ${error 
                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                : 'border-slate-200 bg-white focus:border-blue-500'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <span className="text-sm font-medium text-red-600 flex items-center gap-1">
            <span>⚠️</span> {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-sm text-slate-500">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
