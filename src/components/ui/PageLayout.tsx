import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  header?: React.ReactNode;
  headerAction?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  containerPadding?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  header,
  headerAction,
  maxWidth = 'lg',
  containerPadding = true
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'w-full'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {header && (
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className={`${containerPadding ? 'px-3 sm:px-6 lg:px-8' : ''} py-3 sm:py-4`}>
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                {title && (
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3 truncate">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">⏰</span>
                    <span className="truncate">{title}</span>
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-1 hidden sm:block">{subtitle}</p>
                )}
              </div>
              {headerAction && (
                <div className="flex-shrink-0">
                  {headerAction}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`${containerPadding ? 'px-3 sm:px-6 lg:px-8' : ''} py-4 sm:py-8 md:py-12`}>
        <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
