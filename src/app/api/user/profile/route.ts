import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { 
  encryptRequestData, 
  decryptResponseData, 
  logEncryptedDataAccess,
  checkEncryptedDataPermission,
  sanitizeForLogs
} from '@/lib/encryption/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/types/api';

// Validation schemas
const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().regex(/^[+]?[0-9\s\-\(\)]{10,15}$/).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(500).optional(),
  emergencyContactInfo: z.string().max(1000).optional(),
  medicalHistory: z.string().max(5000).optional(),
  medications: z.string().max(2000).optional(),
  allergies: z.string().max(1000).optional(),
  insuranceInfo: z.string().max(1000).optional(),
});

/**
 * GET /api/user/profile
 * Get user's encrypted profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = req.user!;
    if (!user) {
      await logEncryptedDataAccess(request, 'read', 'User', undefined, false, 'Unauthenticated');
      return NextResponse.json(createErrorResponse('Unauthorized'), { status: 401 });
    }

    // Check permissions
    const hasPermission = await checkEncryptedDataPermission(request, 'read', 'User', user.id);
    if (!hasPermission) {
      await logEncryptedDataAccess(request, 'read', 'User', user.id, false, 'Insufficient permissions');
      return NextResponse.json(createErrorResponse('Forbidden'), { status: 403 });
    }

    // Fetch user profile with encrypted fields
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        UserProfile: true
      },
    });

    if (!userProfile) {
      await logEncryptedDataAccess(request, 'read', 'User', user.id, false, 'Profile not found');
      return NextResponse.json(createErrorResponse('Profile not found'), { status: 404 });
    }

    // Data is automatically decrypted by Prisma middleware
    // But we can also manually decrypt for additional control
    const decryptedData = await decryptResponseData(request, userProfile, 'User');

    // Log successful access
    await logEncryptedDataAccess(request, 'read', 'User', user.id, true);

    // Remove sensitive fields from response
    const safeProfile = {
      id: decryptedData.id,
      fullName: (decryptedData as any).fullName,
      email: decryptedData.email,
      phoneNumber: decryptedData.phoneNumber,
      dateOfBirth: decryptedData.dateOfBirth,
      address: (decryptedData as any).address,
      emergencyContactInfo: (decryptedData as any).emergencyContactInfo,
      role: decryptedData.role,
      isActive: decryptedData.isActive,
      emailVerified: decryptedData.emailVerified,
      profile: (decryptedData as any).profile ? {
        medicalHistory: (decryptedData as any).profile.medicalHistory,
        medications: (decryptedData as any).profile.medications,
        allergies: (decryptedData as any).profile.allergies,
        insuranceInfo: (decryptedData as any).profile.insuranceInfo,
        updatedAt: (decryptedData as any).profile.updatedAt,
      } : null,
      createdAt: decryptedData.createdAt,
      updatedAt: decryptedData.updatedAt,
    };

    return NextResponse.json(createSuccessResponse(safeProfile, 'Profile retrieved successfully'));

  } catch (error) {
    console.error('Profile GET error:', error);
    await logEncryptedDataAccess(request, 'read', 'User', undefined, false, error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      createErrorResponse('Failed to retrieve profile'), 
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Update user's encrypted profile data
 */
export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const user = req.user!;
    if (!user) {
      await logEncryptedDataAccess(request, 'write', 'User', undefined, false, 'Unauthenticated');
      return NextResponse.json(createErrorResponse('Unauthorized'), { status: 401 });
    }

    // Check permissions
    const hasPermission = await checkEncryptedDataPermission(request, 'write', 'User', user.id);
    if (!hasPermission) {
      await logEncryptedDataAccess(request, 'write', 'User', user.id, false, 'Insufficient permissions');
      return NextResponse.json(createErrorResponse('Forbidden'), { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('Profile validation error:', sanitizeForLogs(validationResult.error.format(), 'User'));
      return NextResponse.json(
        createErrorResponse('Invalid profile data', 'VALIDATION_ERROR', validationResult.error.issues),
        { status: 400 }
      );
    }

    const profileData = validationResult.data;

    // Encrypt the request data
    const encryptedData = await encryptRequestData(request, profileData, 'User');

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(encryptedData.fullName && { fullName: encryptedData.fullName }),
        ...(encryptedData.phoneNumber && { phoneNumber: encryptedData.phoneNumber }),
        ...(encryptedData.dateOfBirth && { dateOfBirth: encryptedData.dateOfBirth }),
        ...(encryptedData.address && { address: encryptedData.address }),
        ...(encryptedData.emergencyContactInfo && { emergencyContactInfo: encryptedData.emergencyContactInfo }),
        
        // Update or create profile
        UserProfile: {
          upsert: {
            create: {
              medicalHistory: encryptedData.medicalHistory || null,
              medications: encryptedData.medications || null,
              allergies: encryptedData.allergies || null,
              insuranceInfo: encryptedData.insuranceInfo || null,
            },
            update: {
              ...(encryptedData.medicalHistory && { medicalHistory: encryptedData.medicalHistory }),
              ...(encryptedData.medications && { medications: encryptedData.medications }),
              ...(encryptedData.allergies && { allergies: encryptedData.allergies }),
              ...(encryptedData.insuranceInfo && { insuranceInfo: encryptedData.insuranceInfo }),
            },
          },
        },
      },
      include: {
        UserProfile: true
      },
    });

    // Data is automatically decrypted by Prisma middleware
    const decryptedResponse = await decryptResponseData(request, updatedUser, 'User');

    // Log successful update
    await logEncryptedDataAccess(request, 'write', 'User', user.id, true);

    // Remove sensitive fields from response
    const safeProfile = {
      id: decryptedResponse.id,
      fullName: (decryptedResponse as any).fullName,
      email: decryptedResponse.email,
      phoneNumber: decryptedResponse.phoneNumber,
      dateOfBirth: decryptedResponse.dateOfBirth,
      address: (decryptedResponse as any).address,
      emergencyContactInfo: (decryptedResponse as any).emergencyContactInfo,
      profile: (decryptedResponse as any).profile ? {
        medicalHistory: (decryptedResponse as any).profile.medicalHistory,
        medications: (decryptedResponse as any).profile.medications,
        allergies: (decryptedResponse as any).profile.allergies,
        insuranceInfo: (decryptedResponse as any).profile.insuranceInfo,
        updatedAt: (decryptedResponse as any).profile.updatedAt,
      } : null,
      updatedAt: decryptedResponse.updatedAt,
    };

    return NextResponse.json(
      createSuccessResponse(safeProfile, 'Profile updated successfully')
    );

  } catch (error) {
    console.error('Profile PUT error:', error);
    await logEncryptedDataAccess(request, 'write', 'User', undefined, false, error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      createErrorResponse('Failed to update profile'), 
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/profile
 * Delete user's profile data (GDPR compliance)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = req.user!;
    if (!user) {
      await logEncryptedDataAccess(request, 'delete', 'User', undefined, false, 'Unauthenticated');
      return NextResponse.json(createErrorResponse('Unauthorized'), { status: 401 });
    }

    // Check permissions
    const hasPermission = await checkEncryptedDataPermission(request, 'delete', 'User', user.id);
    if (!hasPermission) {
      await logEncryptedDataAccess(request, 'delete', 'User', user.id, false, 'Insufficient permissions');
      return NextResponse.json(createErrorResponse('Forbidden'), { status: 403 });
    }

    // Delete user profile (cascade will handle related records)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Clear PHI fields
        
        phoneNumber: null,
        dateOfBirth: null,
        address: null,
        emergencyContactInfo: null,
        fullName_hash: null,
        phoneNumber_hash: null,
        // Keep account active but remove PHI
        isActive: false,
        profile: {
          delete: true,
        },
      },
    });

    // Log successful deletion
    await logEncryptedDataAccess(request, 'delete', 'User', user.id, true);

    return NextResponse.json(
      createSuccessResponse(null, 'Profile data deleted successfully')
    );

  } catch (error) {
    console.error('Profile DELETE error:', error);
    await logEncryptedDataAccess(request, 'delete', 'User', undefined, false, error instanceof Error ? error.message : 'Unknown error');
    
    return NextResponse.json(
      createErrorResponse('Failed to delete profile'), 
      { status: 500 }
    );
  }
}