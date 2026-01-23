'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Wrapper component that redirects authenticated users to their respective dashboards.
 * This prevents users from seeing the landing page after logging in.
 */
export function LandingPageWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're certain the user is authenticated with valid data
    if (status === 'authenticated' && session?.user?.id && session.user.role) {
      // Redirect based on user role
      const redirectMap: Record<string, string> = {
        admin: '/admin',
        doctor: '/doctor',
        nurse: '/nurse',
        pharmacist: '/pharmacist',
        'lab-tech': '/lab-tech',
        receptionist: '/receptionist',
        emergency: '/emergency',
      };

      const role = session.user.role.toLowerCase();
      const redirectPath = redirectMap[role] || '/admin';

      // Use replace to prevent back button issues
      router.replace(redirectPath);
    }
  }, [status, session, router]);

  // While session is loading, show nothing
  if (status === 'loading') {
    return null;
  }

  // If authenticated, show nothing (effect will handle redirect)
  if (status === 'authenticated') {
    return null;
  }

  // Only show landing page for unauthenticated users
  return <>{children}</>;
}
