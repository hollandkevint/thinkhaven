'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to new /app/new route
export default function BmadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/new');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto mb-4"></div>
        <p className="text-ink-light">Redirecting...</p>
      </div>
    </div>
  );
}
