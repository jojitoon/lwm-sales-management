import { findOrCreateUser } from '@/services/user';
import axios from 'axios';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// class InvalidLoginError extends CredentialsSignin {
//   code = 'Invalid identifier';
// }

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
      },
      async authorize(credentials) {
        console.log({ credentials });
        if (!credentials.email || !credentials.workspace) return null;

        const session = await findOrCreateUser(
          credentials.email as string,
          credentials.workspace as string,
          credentials.tableId as string
        );

        if (!session) return null;

        return session?.user;
      },
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
    async authorized({ auth, request }) {
      console.log({ auth });

      if (!auth?.user?.id) return false;

      const { data: settings } = await axios.get(
        `${request.nextUrl.origin}/api/settings`
      );

      const { data: mySession } = await axios.get(
        `${request.nextUrl.origin}/api/session/${auth.user.id}`
      );

      console.log(mySession.session, settings.currentSession);

      return mySession.session === settings.currentSession;
    },
  },
});
