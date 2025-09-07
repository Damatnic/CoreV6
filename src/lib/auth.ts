import { NextAuthOptions, User, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import * as bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

// Extend the built-in session type
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
      isEmailVerified: boolean;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Temporarily disabled due to type conflicts
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile: any) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: UserRole.USER,
          isEmailVerified: profile.email_verified || false,
          onboardingCompleted: false,
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          // Always perform dummy hash to prevent timing attacks
          await bcrypt.compare("dummy_password", "$2b$12$dummyhash.to.prevent.timing.attacks.and.enumeration");
          throw new Error("Invalid credentials");
        }

        let user = null;
        let hashedPassword = "$2b$12$dummyhash.to.prevent.timing.attacks.and.enumeration";
        
        try {
          // Always query for user but use dummy hash if not found
          const foundUser = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            include: {
              userProfile: true,
              helperProfile: true,
              adminProfile: true,
            },
          });

          if (foundUser?.hashedPassword) {
            user = foundUser;
            hashedPassword = foundUser.hashedPassword;
          }

          // Always perform password comparison to prevent timing attacks
          const isPasswordValid = await bcrypt.compare(credentials.password, hashedPassword);

          // Check if we have a valid user and password
          if (!user || !isPasswordValid) {
            // If user exists, increment failed attempts
            if (user) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  failedLoginAttempts: { increment: 1 },
                  lockedUntil: user.failedLoginAttempts >= 4 
                    ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
                    : undefined,
                },
              }).catch(() => {}); // Silent fail to prevent information disclosure
            }
            
            // Always log failed attempts with generic error
            await prisma.auditLog.create({
              data: {
                userId: user?.id || null,
                action: "login_failed",
                resource: "auth",
                details: {
                  email: credentials.email.toLowerCase(),
                  reason: "invalid_credentials",
                },
                outcome: "failure",
              },
            }).catch(() => {}); // Silent fail

            throw new Error("Invalid credentials");
          }

          // Additional security checks after password validation
          if (!user.isActive) {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "login_blocked",
                resource: "auth",
                details: { reason: "account_deactivated" },
                outcome: "failure",
              },
            }).catch(() => {});
            throw new Error("Invalid credentials"); // Generic error to prevent enumeration
          }

          // Check account lockout
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                action: "login_blocked",
                resource: "auth",
                details: { 
                  reason: "account_locked",
                  lockedUntil: user.lockedUntil.toISOString(),
                },
                outcome: "failure",
              },
            }).catch(() => {});
            throw new Error("Invalid credentials"); // Generic error
          }

          // Reset failed attempts on successful login and log success
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
              lastActiveAt: new Date(),
            },
          });

          // Log successful authentication
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "login_success",
              resource: "auth",
              details: {
                email: user.email,
                role: user.role,
                method: "credentials",
              },
              outcome: "success",
            },
          }).catch(() => {}); // Silent fail but continue

          // Check onboarding status
          const onboardingCompleted = 
            (user.role === UserRole.USER && (user as any).userProfile?.onboardingCompleted) ||
            (user.role === UserRole.HELPER && (user as any).helperProfile?.isVerified) ||
            (user.role === UserRole.THERAPIST && (user as any).helperProfile?.isVerified) ||
            (user.role === UserRole.CRISIS_COUNSELOR && (user as any).helperProfile?.isVerified) ||
            (user.role === UserRole.ADMIN && (user as any).adminProfile) ||
            (user.role === UserRole.SUPER_ADMIN && (user as any).adminProfile) ||
            false;

          return {
            id: user.id,
            email: user.email,
            name: user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.email,
            image: user.avatarUrl,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            onboardingCompleted,
          };
        } catch (error) {
          // Log detailed error for debugging but don't expose to user
          await prisma.auditLog.create({
            data: {
              userId: user?.id || null,
              action: "login_error",
              resource: "auth",
              details: {
                email: credentials.email.toLowerCase(),
                errorType: error instanceof Error ? error.constructor.name : 'Unknown',
                // Don't log the actual error message for security
              },
              outcome: "failure",
            },
          }).catch(() => {}); // Silent fail

          // Always throw generic error to prevent information disclosure
          if (error instanceof Error && error.message.includes("Invalid credentials")) {
            throw error; // Allow our controlled errors through
          }
          
          // Convert any other errors to generic message
          throw new Error("Authentication service temporarily unavailable");
        }
      },
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.isEmailVerified = user.isEmailVerified;
        token.onboardingCompleted = user.onboardingCompleted;
      }

      // Return token for session
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.isEmailVerified = token.isEmailVerified;
        session.user.onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      try {
        // Handle OAuth providers
        if (account?.provider === "google" && profile?.email) {
          const googleProfile = profile as any;
          
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: googleProfile.email.toLowerCase() },
          });

          if (!existingUser) {
            // Create new user for OAuth
            const newUser = await prisma.user.create({
              data: {
                email: googleProfile.email.toLowerCase(),
                firstName: googleProfile.given_name || "",
                lastName: googleProfile.family_name || "",
                displayName: googleProfile.name || "",
                avatarUrl: googleProfile.picture || "",
                isEmailVerified: googleProfile.email_verified || false,
                role: UserRole.USER,
                privacySettings: JSON.stringify({
                  shareProfile: false,
                  allowDirectMessages: true,
                  showOnlineStatus: false,
                }),
              },
            });

            // Create user profile
            await prisma.userProfile.create({
              data: {
                userId: newUser.id,
                mentalHealthGoals: [],
                interestedTopics: [],
                preferredCommunication: ["chat"],
                crisisContacts: JSON.stringify([]),
                notificationSettings: JSON.stringify({
                  email: true,
                  push: true,
                  crisis: true,
                  appointments: true,
                }),
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error("Sign in callback error:", error);
        return false;
      }
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign in
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "sign_in",
          resource: "auth",
          details: {
            provider: account?.provider,
            isNewUser,
          },
          outcome: "success",
        },
      }).catch((error) => console.error("Audit log error:", error));
    },
    async signOut({ session, token }) {
      // Log sign out
      const userId = session?.user?.id || token?.sub;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: "sign_out",
            resource: "auth",
            outcome: "success",
          },
        }).catch((error) => console.error("Audit log error:", error));
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

// Helper function to check if user has specific role
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = {
    [UserRole.USER]: [
      "read:profile",
      "update:profile",
      "create:posts",
      "read:community",
      "create:appointments",
    ],
    [UserRole.HELPER]: [
      "read:profile",
      "update:profile",
      "create:posts",
      "read:community",
      "manage:sessions",
      "respond:crisis",
    ],
    [UserRole.THERAPIST]: [
      "read:profile",
      "update:profile",
      "create:posts",
      "read:community",
      "manage:sessions",
      "respond:crisis",
      "access:professional_tools",
    ],
    [UserRole.CRISIS_COUNSELOR]: [
      "read:profile",
      "update:profile",
      "manage:sessions",
      "respond:crisis",
      "access:crisis_tools",
      "escalate:emergency",
    ],
    [UserRole.ADMIN]: [
      "read:profile",
      "update:profile",
      "moderate:content",
      "manage:users",
      "access:analytics",
      "manage:helpers",
    ],
    [UserRole.SUPER_ADMIN]: [
      "all:permissions", // Super admin has all permissions
    ],
  };

  const permissions = rolePermissions[userRole] || [];
  return permissions.includes("all:permissions") || permissions.includes(permission);
}