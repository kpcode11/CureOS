import { NextAuthOptions } from 'next-auth';
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
          include: { roleEntity: { include: { rolePermissions: { include: { permission: true } } } } },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        const permissions = (
          user.roleEntity?.rolePermissions?.map((rp) => rp.permission.name) ?? []
        );

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
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
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
      // On initial login
      if (user) {
        console.log('[JWT Callback] User logging in:', (user as any).email);
        token.role = (user as any).role;
        token.id = (user as any).id;
        token.permissions = (user as any).permissions ?? [];
        console.log('[JWT Callback] Initial permissions:', token.permissions);
      }
      
      // Always refresh permissions to ensure they're up-to-date
      if (token.id) {
        try {
          const updatedUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { roleEntity: { include: { rolePermissions: { include: { permission: true } } } } },
          });
          
          if (updatedUser?.roleEntity) {
            const permissions = updatedUser.roleEntity.rolePermissions.map((rp) => rp.permission.name);
            console.log('[JWT Callback] Refreshed permissions for', updatedUser.email, ':', permissions);
            token.permissions = permissions;
            token.role = updatedUser.role;
          } else {
            console.warn('[JWT Callback] User has no roleEntity:', updatedUser?.email);
          }
        } catch (error) {
          console.error('[JWT Callback] Error refreshing permissions:', error);
          // Keep existing permissions if refresh fails
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        (session.user as any).permissions = (token as any).permissions ?? [];
        console.log('[Session Callback] Session permissions for', session.user.email, ':', (session.user as any).permissions);
      }
      return session;
    },
  },
};

