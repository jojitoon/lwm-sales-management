import { findOrCreateUser } from '@/services/user';
import axios from 'axios';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import { verifyPassword } from './password';
// import * as bcrypt from '@node-rs/bcrypt';

export const { handlers, signIn, signOut, auth } = NextAuth({
  //   adapter: PrismaAdapter(prisma as any),
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        workspace: { label: 'Workspace', type: 'text' },
        tableId: { label: 'Table Id', type: 'text' },
        tableType: { label: 'Table Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.workspace) return null;

        const session = await findOrCreateUser(
          credentials.email as string,
          credentials.workspace as string,
          credentials.tableId as string,
          credentials.tableType as string
        );

        if (!session) return null;

        return session?.user;
      },
    }),
    {
      id: 'admin',
      name: 'admin',
      type: 'credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.password) return null;

          const settings = await prisma.setting.findUnique({
            where: {
              id: 'settings',
            },
          });

          if (!settings?.adminPassword) return null;

          const isPasswordValid = await verifyPassword(
            credentials.password as string,
            settings.adminPassword as string
          );

          if (!isPasswordValid) return null;

          const user = await prisma.user.findUnique({
            where: {
              email: 'admin@admin.com',
            },
          });

          if (!user) return null;

          return user;
        } catch (error) {
          console.log(error);
          return null;
        }
      },
    },
  ],
  callbacks: {
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          isAdmin: session?.user?.email === 'admin@admin.com',
        },
      };
    },
    async authorized({ auth, request }) {
      if (!auth?.user?.id) return false;
      if ((auth?.user as any)?.isAdmin) return true;

      const { data: settings } = await axios.get(
        `${request.nextUrl.origin}/api/settings`
      );

      const { data: mySession } = await axios.get(
        `${request.nextUrl.origin}/api/session/${auth.user.id}`
      );
      console.log(mySession?.session, settings?.currentSession);

      return mySession?.session === settings?.currentSession;
    },
  },
});
