import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { compare, hash } from "bcrypt";
import { connectToDatabase } from "../../../../lib/mongodb";

// Add type declarations to extend the session user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

// Auth options configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log(`Auth attempt for user: ${credentials.email}`);
          
          // Connect to database
          const { db } = await connectToDatabase();
          const collection = db.collection('users');

          // Find the user
          const user = await collection.findOne({ email: credentials.email });

          // If user doesn't exist, register a new one
          if (!user) {
            console.log(`Creating new user: ${credentials.email}`);
            const hashedPassword = await hash(credentials.password, 10);
            const newUser = {
              email: credentials.email,
              password: hashedPassword,
              createdAt: new Date().toISOString()
            };

            await collection.insertOne(newUser);
            console.log(`User created successfully: ${credentials.email}`);
            
            return {
              id: newUser.email,
              email: newUser.email,
              name: credentials.email.split('@')[0]
            };
          }

          // Verify password
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) {
            console.log(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          console.log(`User authenticated successfully: ${credentials.email}`);
          
          // Return the user
          return {
            id: user.email,
            email: user.email,
            name: user.name || user.email.split('@')[0]
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'email' in user) {
        token.id = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 