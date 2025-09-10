import classNames from 'classnames';
import React from 'react';

export const AccessDenied: React.FC = () => (
  <html lang="en" className="dark" data-color-mode="dark">
    <body className={classNames('font', 'h-full', 'bg-layer-1')}>
      <div className="flex h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-6xl font-bold text-error">403</h1>
          <p className="mt-4 text-lg text-primary">Access Denied</p>
          <p className="mt-2 text-sm text-secondary">You do not have permission to view this page.</p>
        </div>
      </div>
    </body>
  </html>
);
