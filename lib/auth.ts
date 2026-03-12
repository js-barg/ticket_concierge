import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { getServerSession as getSession } from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from './db';

// Required for JWT signing/decryption. Use a stable secret in production (e.g. from Secret Manager).
const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === 'development'
    ? 'ticket-concierge-dev-secret-min-32-chars'
    : undefined);

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('NEXTAUTH_SECRET is not set; auth may be insecure.');
}
if (process.env.NODE_ENV === 'development' && !process.env.NEXTAUTH_SECRET) {
  console.warn(
    '[next-auth] Using dev fallback secret. Set NEXTAUTH_SECRET in .env for production.'
  );
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email, isActive: true }
        });
        if (!user?.passwordHash) return null;
        const ok = await compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
};

export type AdminRole = 'ADMIN' | 'FULFILLMENT' | 'FINANCE';

const ADMIN_ROLES: AdminRole[] = ['ADMIN', 'FULFILLMENT', 'FINANCE'];

function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === 'string' && (ADMIN_ROLES as string[]).includes(role);
}

/**
 * Get the current session (use in Server Components, Route Handlers, API routes).
 * Returns null if not authenticated.
 */
export async function getServerSession(
  ...args:
    | [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getSession(...args, authOptions);
}

/**
 * Require one of the admin roles. Returns session user or null if not allowed.
 */
export function requireAdminRole(
  sessionUser: { role?: unknown } | null
): sessionUser is { id: string; email: string; name: string; role: AdminRole } {
  return !!sessionUser && isAdminRole(sessionUser.role);
}
