import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/admin',
  '/admin/rbac',
  '/dashboard',
];

// Routes that require specific permissions
const permissionRequiredRoutes: Record<string, string[]> = {
  '/admin/rbac': ['roles.manage', 'users.manage'],
  '/admin': ['roles.manage'],
};

export default withAuth(
  function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = (request as any).nextauth?.token;

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
