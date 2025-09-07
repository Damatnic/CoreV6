import { NextRequest } from 'next/server';
import { generatePrismaCreateFields } from "@/lib/prisma-helpers";
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-middleware';
import {
  createAuditLog,
  validateRequest,
  successResponse,
  errorResponse,
  getClientIp,
  wellnessGoalSchema,
} from '@/lib/api-utils';

// Interface for wellness goals (stored in UserProfile.mentalHealthGoals as JSON)
interface WellnessGoal {
  id: string;
  title: string;
  description?: string;
  category: 'mental' | 'physical' | 'social' | 'spiritual' | 'professional';
  targetDate?: string;
  milestones?: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
  }>;
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// GET /api/user/wellness-goals - Get user's wellness goals
export const GET = withAuth(async (req) => {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    
    // Get user profile with goals
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        mentalHealthGoals: true,
      },
    });
    
    if (!userProfile) {
      return successResponse({ goals: [], categories: [] }, 200);
    }
    
    // Parse goals from JSON stored in mentalHealthGoals array
    let goals: WellnessGoal[] = [];
    
    // In the database, mentalHealthGoals is stored as a string array
    // We'll use the first element to store JSON data for all goals
    if (userProfile.mentalHealthGoals && userProfile.mentalHealthGoals.length > 0) {
      try {
        const goalsData = userProfile.mentalHealthGoals[0];
        if (goalsData.startsWith('{') || goalsData.startsWith('[')) {
          const parsed = JSON.parse(goalsData);
          goals = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        // If parsing fails, treat as simple string goals
        goals = userProfile.mentalHealthGoals.map((goal, index) => ({
          id: `goal-${index}`,
          title: goal,
          category: 'mental' as const,
          progress: 0,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    
    // Filter goals
    let filteredGoals = goals;
    
    if (category) {
      filteredGoals = filteredGoals.filter(g => g.category === category);
    }
    
    if (status) {
      filteredGoals = filteredGoals.filter(g => g.status === status);
    }
    
    // Calculate statistics
    const stats = {
      total: goals.length,
      active: goals.filter(g => g.status === 'active').length,
      completed: goals.filter(g => g.status === 'completed').length,
      averageProgress: goals.length > 0 
        ? goals.reduce((sum, g) => sum + g.progress, 0) / goals.length 
        : 0,
      byCategory: goals.reduce((acc: any, g) => {
        acc[g.category] = (acc[g.category] || 0) + 1;
        return acc;
      }, {}),
    };
    
    // Get recent achievements
    const recentAchievements = goals
      .filter(g => g.status === 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
    
    return successResponse({
      goals: filteredGoals,
      stats,
      recentAchievements,
    }, 200);
  } catch (error) {
    console.error('Wellness goals fetch error:', error);
    return errorResponse('Failed to fetch wellness goals', 500);
  }
});

// POST /api/user/wellness-goals - Create a new wellness goal
export const POST = withAuth(async (req) => {
  try {
    const userId = req.user!.id;
    const body = await req.json();
    const validation = validateRequest(body, wellnessGoalSchema);
    
    if (!validation.success) {
      return errorResponse(validation.error, 400);
    }
    
    const data = validation.data;
    
    // Get or create user profile
    let userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });
    
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          mentalHealthGoals: [],
          interestedTopics: [],
          preferredCommunication: ['email'],
          crisisContacts: JSON.stringify([]),
          notificationSettings: JSON.stringify({
            email: true,
            push: false,
            crisis: true,
            appointments: true,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
    
    // Parse existing goals
    let goals: WellnessGoal[] = [];
    
    if (userProfile.mentalHealthGoals && userProfile.mentalHealthGoals.length > 0) {
      try {
        const goalsData = userProfile.mentalHealthGoals[0];
        if (goalsData.startsWith('{') || goalsData.startsWith('[')) {
          const parsed = JSON.parse(goalsData);
          goals = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        // Convert simple string goals to structured format
        goals = userProfile.mentalHealthGoals.map((goal, index) => ({
          id: `goal-${index}`,
          title: goal,
          category: 'mental' as const,
          progress: 0,
          status: 'active' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }
    }
    
    // Create new goal
    const newGoal: WellnessGoal = {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      milestones: data.milestones?.map(m => ({
        id: crypto.randomUUID(),
        title: m.title,
        completed: m.completed || false,
      })),
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add new goal
    goals.push(newGoal);
    
    // Update user profile with new goals
    await prisma.userProfile.update({
      where: { userId },
      data: {
        mentalHealthGoals: [JSON.stringify(goals)], // Store as JSON in first array element
        updatedAt: new Date(),
      },
    });
    
    // Log goal creation
    await createAuditLog({
      userId,
      action: 'user.wellness_goal.create',
      resource: 'wellness_goal',
      resourceId: newGoal.id,
      details: {
        title: newGoal.title,
        category: newGoal.category,
        hasMilestones: !!newGoal.milestones?.length,
      },
      outcome: 'success',
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
    });
    
    // Create encouraging notification
    await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
        userId,
        type: 'goal_created',
        title: 'New wellness goal created!',
        message: `Great job setting your goal: "${newGoal.title}". You've taken an important step towards your wellbeing!`,
        metadata: JSON.stringify({ goalId: newGoal.id }),
        createdAt: new Date(),
      },
    });
    
    return successResponse({
      message: 'Wellness goal created successfully',
      goal: newGoal,
    }, 201);
  } catch (error) {
    console.error('Wellness goal creation error:', error);
    return errorResponse('Failed to create wellness goal', 500);
  }
});

// PUT /api/user/wellness-goals - Update a wellness goal
export const PUT = withAuth(async (req) => {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return errorResponse('Goal ID is required', 400);
    }
    
    const body = await req.json();
    
    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });
    
    if (!userProfile) {
      return errorResponse('User profile not found', 404);
    }
    
    // Parse existing goals
    let goals: WellnessGoal[] = [];
    
    if (userProfile.mentalHealthGoals && userProfile.mentalHealthGoals.length > 0) {
      try {
        const goalsData = userProfile.mentalHealthGoals[0];
        if (goalsData.startsWith('{') || goalsData.startsWith('[')) {
          const parsed = JSON.parse(goalsData);
          goals = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        return errorResponse('Failed to parse existing goals', 500);
      }
    }
    
    // Find goal to update
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return errorResponse('Wellness goal not found', 404);
    }
    
    const existingGoal = goals[goalIndex];
    
    // Update goal
    const updatedGoal: WellnessGoal = {
      ...existingGoal,
      title: body.title || existingGoal.title,
      description: body.description !== undefined ? body.description : existingGoal.description,
      category: body.category || existingGoal.category,
      targetDate: body.targetDate !== undefined ? body.targetDate : existingGoal.targetDate,
      milestones: body.milestones !== undefined ? body.milestones : existingGoal.milestones,
      progress: body.progress !== undefined ? body.progress : existingGoal.progress,
      status: body.status || existingGoal.status,
      updatedAt: new Date().toISOString(),
    };
    
    // Check if goal is completed
    if (updatedGoal.progress >= 100 && updatedGoal.status === 'active') {
      updatedGoal.status = 'completed';
      
      // Create celebration notification
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type: 'goal_completed',
          title: 'Congratulations! Goal Completed!',
          message: `You've successfully completed your goal: "${updatedGoal.title}". This is a significant achievement!`,
          isPriority: true,
          metadata: JSON.stringify({ goalId: updatedGoal.id }),
          createdAt: new Date(),
        },
      });
    }
    
    // Update goals array
    goals[goalIndex] = updatedGoal;
    
    // Update user profile
    await prisma.userProfile.update({
      where: { userId },
      data: {
        mentalHealthGoals: [JSON.stringify(goals)],
        updatedAt: new Date(),
      },
    });
    
    // Log goal update
    await createAuditLog({
      userId,
      action: 'user.wellness_goal.update',
      resource: 'wellness_goal',
      resourceId: goalId,
      details: {
        changes: Object.keys(body),
        completed: updatedGoal.status === 'completed',
      },
      outcome: 'success',
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
    });
    
    return successResponse({
      message: 'Wellness goal updated successfully',
      goal: updatedGoal,
    }, 200);
  } catch (error) {
    console.error('Wellness goal update error:', error);
    return errorResponse('Failed to update wellness goal', 500);
  }
});

// DELETE /api/user/wellness-goals - Delete a wellness goal
export const DELETE = withAuth(async (req) => {
  try {
    const userId = req.user!.id;
    const { searchParams } = new URL(req.url);
    const goalId = searchParams.get('id');
    
    if (!goalId) {
      return errorResponse('Goal ID is required', 400);
    }
    
    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });
    
    if (!userProfile) {
      return errorResponse('User profile not found', 404);
    }
    
    // Parse existing goals
    let goals: WellnessGoal[] = [];
    
    if (userProfile.mentalHealthGoals && userProfile.mentalHealthGoals.length > 0) {
      try {
        const goalsData = userProfile.mentalHealthGoals[0];
        if (goalsData.startsWith('{') || goalsData.startsWith('[')) {
          const parsed = JSON.parse(goalsData);
          goals = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        return errorResponse('Failed to parse existing goals', 500);
      }
    }
    
    // Find goal to delete
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return errorResponse('Wellness goal not found', 404);
    }
    
    const deletedGoal = goals[goalIndex];
    
    // Remove goal
    goals.splice(goalIndex, 1);
    
    // Update user profile
    await prisma.userProfile.update({
      where: { userId },
      data: {
        mentalHealthGoals: goals.length > 0 ? [JSON.stringify(goals)] : [],
        updatedAt: new Date(),
      },
    });
    
    // Log goal deletion
    await createAuditLog({
      userId,
      action: 'user.wellness_goal.delete',
      resource: 'wellness_goal',
      resourceId: goalId,
      details: {
        title: deletedGoal.title,
        category: deletedGoal.category,
        wasCompleted: deletedGoal.status === 'completed',
      },
      outcome: 'success',
      ipAddress: getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
    });
    
    return successResponse({
      message: 'Wellness goal deleted successfully',
    }, 200);
  } catch (error) {
    console.error('Wellness goal deletion error:', error);
    return errorResponse('Failed to delete wellness goal', 500);
  }
});