import { NextRequest, NextResponse } from "next/server";
import { generatePrismaCreateFields } from "@/lib/prisma-helpers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain uppercase, lowercase, number, and special character"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
  agreeToTerms: z.boolean().refine(val => val === true, "Must agree to terms"),
  agreeToPrivacy: z.boolean().refine(val => val === true, "Must agree to privacy policy"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const user = await (prisma.user as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
        anonymousId: crypto.randomUUID(),
        email: validatedData.email.toLowerCase(),
        hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        displayName: `${validatedData.firstName} ${validatedData.lastName}`,
        role: validatedData.role,
        privacySettings: JSON.stringify({
          shareProfile: false,
          allowDirectMessages: true,
          showOnlineStatus: false,
        }),
        updatedAt: new Date(),
      },
    });

    // Create email verification record
    await (prisma.emailVerification as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
        userId: user.id,
        token: verificationToken,
        email: user.email!,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Create appropriate profile based on role
    if (validatedData.role === UserRole.USER) {
      await (prisma.userProfile as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
          userId: user.id,
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
          updatedAt: new Date(),
        },
      });
    } else if (validatedData.role === UserRole.HELPER || validatedData.role === UserRole.THERAPIST || validatedData.role === UserRole.CRISIS_COUNSELOR) {
      await (prisma.helperProfile as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
          userId: user.id,
          specializations: [],
          credentials: JSON.stringify({}),
          experience: "",
          approach: "",
          languages: ["en"],
          availability: JSON.stringify({}),
          updatedAt: new Date(),
        },
      });
    } else if (validatedData.role === UserRole.ADMIN || validatedData.role === UserRole.SUPER_ADMIN) {
      await (prisma.adminProfile as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
          userId: user.id,
          adminLevel: validatedData.role === UserRole.SUPER_ADMIN ? "SUPER_ADMIN" : "MODERATOR",
          departments: [],
          permissions: JSON.stringify({}),
          updatedAt: new Date(),
        },
      });
    }

    // Log audit event
    await (prisma.auditLog as any).create({
        data: {
          id: generatePrismaCreateFields().id, id: crypto.randomUUID(),
        userId: user.id,
        action: "user_registration",
        resource: "user",
        resourceId: user.id,
        details: {
          role: validatedData.role,
          email: validatedData.email,
        },
        outcome: "success",
      },
    });

    // TODO: Send verification email
    // await sendVerificationEmail(user.email!, verificationToken);

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          requiresVerification: !user.isEmailVerified,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}