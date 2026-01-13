import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const variants = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✓',
      text: 'text-green-800',
      iconColor: 'text-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '✕',
      text: 'text-red-800',
      iconColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: '⚠',
      text: 'text-amber-800',
      iconColor: 'text-amber-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'ℹ',
      text: 'text-blue-800',
      iconColor: 'text-blue-600'
    }
  };

  const variant = variants[type];

  return (
    <div className={`${variant.bg} border ${variant.border} rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4`}>
      <span className={`${variant.iconColor} text-xl font-bold flex-shrink-0`}>
        {variant.icon}
      </span>
      <p className={`${variant.text} text-sm font-medium flex-1`}>
        {message}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
};
