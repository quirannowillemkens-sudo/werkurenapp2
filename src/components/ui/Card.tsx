import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, ...props }, ref) => {
    const baseStyles = 'rounded-xl transition-all duration-200';
    
    const variantStyles = {
      default: 'bg-white shadow-sm',
      elevated: 'bg-white shadow-lg',
      outlined: 'bg-white border border-slate-200'
    };

    const hoverStyle = hover ? 'hover:shadow-lg hover:scale-[1.02]' : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${hoverStyle} ${className || ''}`}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
