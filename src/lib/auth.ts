// src/lib/auth.ts
import { NextAuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      permissions?: string[];
    };
  }

  interface User {
    role: string;
    permissions?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    permissions?: string[];
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            roleEntity: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        const permissions =
          user.roleEntity?.rolePermissions?.map(
            (rp) => rp.permission.name,
          ) ?? [];

        // 🔍 ADD THESE 6 DEBUG LINES HERE:
        console.log('🔍 AUTH DEBUG (authorize):');
        console.log('User ID:', user.id);
        console.log('User role:', user.role);
        console.log('roleEntity exists?', !!user.roleEntity);
        console.log('rolePermissions count:', user.roleEntity?.rolePermissions?.length || 0);
        console.log('Raw permissions:', permissions);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
        } as any;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
  },
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === 'production' ? '__Secure-' : ''
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${
        process.env.NODE_ENV === 'production' ? '__Secure-' : ''
      }next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.permissions = (user as any).permissions ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        (session.user as any).id = token.id;
        (session.user as any).permissions = (token as any).permissions ?? [];
        
        console.log('=== SESSION DEBUG ===');
        console.log('Token permissions:', (token as any).permissions);
        console.log('Session permissions:', (session.user as any).permissions);
        console.log('User ID:', token.id);
      }
      return session;
    },
  },
};

/**
 * Helper to get current authenticated user on the server
 * Use this in app router API routes (route.ts)
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  return {
    id: (session.user as any).id as string,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    permissions: (session.user as any).permissions as string[] | undefined,
  };
}
