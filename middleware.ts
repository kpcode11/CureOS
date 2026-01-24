import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/admin',
  '/admin/rbac',
  '/dashboard',
  '/doctor',
  '/nurse',
  '/pharmacist',
  '/receptionist',
  '/lab-tech',
  '/emergency',
];

// Routes that require specific permissions
const permissionRequiredRoutes: Record<string, string[]> = {
  '/admin/rbac': ['admin.roles.manage', 'admin.users.read'],
  '/admin': ['admin.roles.manage'],
  '/emergency': ['emergency.read', 'emergency.create', 'emergency.request'],
};

// Role-based route restrictions
const roleRouteMap: Record<string, string[]> = {
  'ADMIN': ['/admin', '/emergency'],
  'DOCTOR': ['/doctor', '/emergency'],
  'NURSE': ['/nurse', '/emergency'],
  'PHARMACIST': ['/pharmacist'],
  'RECEPTIONIST': ['/receptionist', '/emergency'],
  'LAB_TECH': ['/lab-tech'],
  'EMERGENCY': ['/emergency'],
};

export default withAuth(
  function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = (request as any).nextauth?.token;
    const userRole = token?.role as string;

    // Enforce role-based route access
    if (userRole && roleRouteMap[userRole]) {
      const allowedPaths = roleRouteMap[userRole];
      const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path));

      // If user is trying to access a dashboard that isn't theirs, redirect
      const isDashboardRoute = ['/admin', '/doctor', '/nurse', '/pharmacist', '/receptionist', '/lab-tech', '/emergency'].some(path => pathname.startsWith(path));
      
      if (isDashboardRoute && !isAllowedPath) {
        // Redirect to user's correct dashboard
        const correctPath = allowedPaths[0];
        return NextResponse.redirect(new URL(correctPath, request.url));
      }
    }

    // Check if route requires specific permissions
    for (const [route, requiredPerms] of Object.entries(permissionRequiredRoutes)) {
      if (pathname.startsWith(route)) {
        const userPermissions = (token?.permissions as string[]) || [];
        const hasPermission = requiredPerms.some(perm => userPermissions.includes(perm));

        if (!hasPermission) {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public routes
        if (pathname === '/' || pathname === '/login') {
          return true;
        }

        // Protected routes require authentication
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Allow public routes
        if (pathname === '/' || pathname === '/login') {
          return true;
        }

        // Protected routes require authentication
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token;
        }

        return true;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
