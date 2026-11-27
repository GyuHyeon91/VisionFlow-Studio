import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VisionFlow Studio — Next.js Option',
  description: '프론트엔드 옵션 next 선택 시 실행되는 엔트리',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
