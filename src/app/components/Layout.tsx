import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <header className="header">
        <h1>Toggl ↔ YouTrack Integration</h1>
      </header>
      <main className="main">
        {children}
      </main>
    </>
  );
};
