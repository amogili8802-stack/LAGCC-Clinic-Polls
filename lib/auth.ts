import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/coach/login",
  },
  providers: [
    CredentialsProvider({
      name: "Coach Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const coach = await prisma.coach.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });
        if (!coach) return null;

        const valid = await bcrypt.compare(credentials.password, coach.passwordHash);
        if (!valid) return null;

        return { id: coach.id, name: coach.name, email: coach.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.coachId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.coachId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
