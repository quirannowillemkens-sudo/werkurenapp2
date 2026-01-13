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
          <div className={`${containerPadding ? 'px-4 sm:px-6 lg:px-8' : ''} py-4`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                {title && (
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <span className="text-3xl">⏰</span>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-slate-600 text-sm sm:text-base mt-1">{subtitle}</p>
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

      <main className={`${containerPadding ? 'px-4 sm:px-6 lg:px-8' : ''} py-8 sm:py-12`}>
        <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
