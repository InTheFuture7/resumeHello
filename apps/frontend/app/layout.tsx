import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './(default)/css/globals.css';

const spaceGrotesk = localFont({
  src: '../public/fonts/space-grotesk-v22-latin-regular.woff2',
  variable: '--font-space-grotesk',
  display: 'swap',
});

const geist = localFont({
  src: '../public/fonts/geist-v4-latin-regular.woff2',
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Resume Matcher',
  description: 'Build your resume with Resume Matcher',
  applicationName: 'Resume Matcher',
  keywords: ['resume', 'matcher', 'job', 'application'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className="h-full" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${spaceGrotesk.variable} antialiased bg-[#F0F0E8] text-gray-900 min-h-full`}
      >
        {children}
      </body>
    </html>
  );
}
