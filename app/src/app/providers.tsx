'use client';

import { MeetingProvider } from '@/store/meetingStore';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return <MeetingProvider>{children}</MeetingProvider>;
}
