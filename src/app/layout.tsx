import './globals.css';
import type { Metadata } from 'next';
import { VT323 } from 'next/font/google';
import { ToastProvider } from '@/components/ui/toast';

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskForge — RPG Edition',
  description: 'Task & billing tracker for freelancers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={vt323.variable}>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
