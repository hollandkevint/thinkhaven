'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Redirect to new /app/session/[id] route
export default function WorkspaceRedirect() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      router.replace(`/app/session/${params.id}`);
    }
  }, [router, params.id]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta mx-auto mb-4"></div>
        <p className="text-ink-light">Redirecting...</p>
      </div>
    </div>
  );
}
