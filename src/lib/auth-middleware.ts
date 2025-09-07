import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, hasRole, hasPermission } from "./auth-simple";
import { UserRole } from "@prisma/client";
import { prisma } from "./prisma";
import { generatePrismaCreateFields } from "./prisma-helpers";
import type { Session } from "next-auth";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string | null;
    role: UserRole;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
  };
}

// Middleware factory for authentication
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions) as Session | null;

      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized - Please sign in" },
          { status: 401 }
        );
      }

      // Attach user to request with proper type mapping
      (req as AuthenticatedRequest).user = {
        id: session.user.id,
        email: session.user.email || null,
        role: session.user.role as UserRole,
        isEmailVerified: (session.user as any).isEmailVerified || false,
        onboardingCompleted: (session.user as any).onboardingCompleted || false,
      };

      return await handler(req as AuthenticatedRequest);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

// Middleware factory for role-based access control
export function withRoles(
  requiredRoles: UserRole[],
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;

    if (!hasRole(user.role, requiredRoles)) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          id: generatePrismaCreateFields().id,
          userId: user.id,
          action: "unauthorized_access_attempt",
          resource: "api_endpoint",
          details: {
            requiredRoles,
            userRole: user.role,
            endpoint: req.url,
          },
          outcome: "failure",
        },
      }).catch(console.error);

      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Middleware factory for permission-based access control
export function withPermission(
  permission: string,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;

    if (!hasPermission(user.role, permission)) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          id: generatePrismaCreateFields().id,
          userId: user.id,
          action: "unauthorized_access_attempt",
          resource: "api_endpoint",
          details: {
            requiredPermission: permission,
            userRole: user.role,
            endpoint: req.url,
          },
          outcome: "failure",
        },
      }).catch(console.error);

      return NextResponse.json(
        { error: "Forbidden - Missing required permission" },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Middleware for email verification requirement
export function withEmailVerification(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { 
          error: "Email verification required",
          code: "EMAIL_NOT_VERIFIED",
          redirectTo: "/auth/verify-email"
        },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Middleware for onboarding completion requirement
export function withOnboarding(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;

    if (!user.onboardingCompleted) {
      return NextResponse.json(
        { 
          error: "Onboarding completion required",
          code: "ONBOARDING_INCOMPLETE",
          redirectTo: "/onboarding"
        },
        { status: 403 }
      );
    }

    return await handler(req);
  });
}

// Middleware for admin-only routes
export const withAdmin = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
  withRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN], handler);

// Middleware for helper/therapist routes
export const withHelper = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
  withRoles([UserRole.HELPER, UserRole.THERAPIST, UserRole.CRISIS_COUNSELOR, UserRole.ADMIN, UserRole.SUPER_ADMIN], handler);

// Middleware for crisis counselor routes
export const withCrisisCounselor = (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
  withRoles([UserRole.CRISIS_COUNSELOR, UserRole.ADMIN, UserRole.SUPER_ADMIN], handler);

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest) => {
      const userId = req.user!.id;
      const now = Date.now();
      const userRequests = requests.get(userId);

      if (!userRequests || now > userRequests.resetTime) {
        requests.set(userId, { count: 1, resetTime: now + windowMs });
        return await handler(req);
      }

      if (userRequests.count >= maxRequests) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }

      userRequests.count++;
      return await handler(req);
    });
}

// API key validation middleware (for external integrations)
export function withApiKey(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const apiKey = req.headers.get("X-API-Key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }

    // TODO: Validate API key against database
    // For now, just check for a valid format
    if (!apiKey.startsWith("ak_")) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 401 }
      );
    }

    return await handler(req as AuthenticatedRequest);
  };
}

// Helper function to get user from request
export async function getUserFromRequest(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  return session?.user || null;
}

// Helper function to get current user from session
export async function getCurrentUser() {
  const session = await getServerSession(authOptions) as Session | null;
  
  if (!session?.user) {
    return null;
  }

  // Get full user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      UserProfile: true,
      HelperProfile: true,
      AdminProfile: true,
    },
  });

  return user;
}

// Helper function to check if user can access resource
export async function canAccessResource(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string = "read"
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserProfile: true,
        HelperProfile: true,
        AdminProfile: true,
      },
    });

    if (!user) return false;

    // Super admin can access everything
    if (user.role === UserRole.SUPER_ADMIN) return true;

    // Resource-specific access control
    switch (resourceType) {
      case "user_profile":
        return userId === resourceId || hasRole(user.role, [UserRole.ADMIN]);
      
      case "session":
        // Users can access their own sessions, helpers can access sessions they're involved in
        if (userId === resourceId) return true;
        if (hasRole(user.role, [UserRole.HELPER, UserRole.THERAPIST, UserRole.CRISIS_COUNSELOR])) {
          // TODO: Check if user is assigned to this session
          return true;
        }
        return false;
      
      case "crisis_report":
        // Crisis counselors and admins can access crisis reports
        return hasRole(user.role, [UserRole.CRISIS_COUNSELOR, UserRole.ADMIN]);
      
      default:
        return false;
    }
  } catch (error) {
    console.error("Access check error:", error);
    return false;
  }
}