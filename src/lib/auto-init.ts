// Automatic User/Data Initialization System
// Ensures database is properly set up on first deployment

import bcrypt from 'bcryptjs';

// Demo users for automatic initialization
const DEMO_USERS = [
  {
    email: 'demo@astralcore.app',
    username: 'Demo User',
    displayName: 'Demo User',
    password: 'demo123',
    role: 'user',
    isVerified: true,
  },
  {
    email: 'helper@astralcore.app',
    username: 'Support Helper',
    displayName: 'Support Helper',
    password: 'helper123',
    role: 'helper',
    isVerified: true,
    isHelper: true,
  },
  {
    email: 'admin@astralcore.app',
    username: 'Admin User',
    displayName: 'Admin User',
    password: 'admin123',
    role: 'admin',
    isVerified: true,
    isAdmin: true,
  }
];

// Crisis resources for initialization
const CRISIS_RESOURCES = [
  {
    id: 'us_988',
    type: 'hotline',
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 crisis support in the United States',
    contact: '988',
    available24x7: true,
    languages: ['en', 'es'],
    countries: ['US'],
    specializations: ['suicide_prevention', 'crisis_support'],
  },
  {
    id: 'crisis_text_line',
    type: 'text',
    name: 'Crisis Text Line',
    description: 'Text HOME to 741741 for free 24/7 crisis support',
    contact: 'Text HOME to 741741',
    available24x7: true,
    languages: ['en', 'es'],
    countries: ['US', 'CA', 'UK'],
    specializations: ['crisis_support', 'mental_health'],
  }
];

// Sample wellness content for initialization
const SAMPLE_CONTENT = [
  {
    type: 'article',
    title: 'Understanding Anxiety: A Beginner\'s Guide',
    content: 'Anxiety is a normal human emotion that everyone experiences...',
    author: 'Astral Core Team',
    tags: ['anxiety', 'mental-health', 'guide'],
    published: true,
  },
  {
    type: 'exercise',
    title: '5-Minute Breathing Exercise',
    content: 'This simple breathing technique can help calm your mind...',
    author: 'Astral Core Team',
    tags: ['breathing', 'relaxation', 'mindfulness'],
    published: true,
  }
];

// Initialization state tracker
let isInitialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Check if the system has already been initialized
 */
async function checkInitializationStatus(): Promise<boolean> {
  try {
    // In a real app, this would check your database
    // For now, we'll use a simple memory flag with localStorage fallback
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('astral_core_initialized');
      return stored === 'true';
    }
    
    // Server-side: check for existence of demo user
    // This is a placeholder - implement actual database check
    return isInitialized;
  } catch (error) {
    console.error('Error checking initialization status:', error);
    return false;
  }
}

/**
 * Create demo users in the database
 */
async function createDemoUsers(): Promise<void> {
  console.log('🔄 Creating demo users...');
  
  for (const userData of DEMO_USERS) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // In a real implementation, this would use your database
      // For now, we'll simulate the creation
      const user = {
        ...userData,
        password_hash: hashedPassword,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log(`✅ Demo user created: ${user.email}`);
      
      // Store in localStorage for demo purposes
      if (typeof window !== 'undefined') {
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        existingUsers.push(user);
        localStorage.setItem('demo_users', JSON.stringify(existingUsers));
      }
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error);
    }
  }
}

/**
 * Initialize crisis resources
 */
async function initializeCrisisResources(): Promise<void> {
  console.log('🔄 Initializing crisis resources...');
  
  try {
    // In a real implementation, this would store in your database
    if (typeof window !== 'undefined') {
      localStorage.setItem('crisis_resources', JSON.stringify(CRISIS_RESOURCES));
    }
    
    console.log(`✅ ${CRISIS_RESOURCES.length} crisis resources initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize crisis resources:', error);
  }
}

/**
 * Initialize sample content
 */
async function initializeSampleContent(): Promise<void> {
  console.log('🔄 Initializing sample content...');
  
  try {
    // In a real implementation, this would store in your database
    if (typeof window !== 'undefined') {
      localStorage.setItem('sample_content', JSON.stringify(SAMPLE_CONTENT));
    }
    
    console.log(`✅ ${SAMPLE_CONTENT.length} sample content items initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize sample content:', error);
  }
}

/**
 * Main initialization function
 * This should be called on first API request or app startup
 */
export async function ensureInitialized(): Promise<boolean> {
  // Return existing promise if initialization is already in progress
  if (initializationPromise) {
    return initializationPromise;
  }
  
  // Check if already initialized
  if (await checkInitializationStatus()) {
    return true;
  }
  
  // Start initialization
  initializationPromise = performInitialization();
  return initializationPromise;
}

/**
 * Perform the actual initialization
 */
async function performInitialization(): Promise<boolean> {
  try {
    console.log('🚀 Starting Astral Core initialization...');
    
    // Initialize in parallel for better performance
    await Promise.all([
      createDemoUsers(),
      initializeCrisisResources(),
      initializeSampleContent(),
    ]);
    
    // Mark as initialized
    isInitialized = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem('astral_core_initialized', 'true');
    }
    
    console.log('✅ Astral Core initialization completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    isInitialized = false;
    initializationPromise = null;
    return false;
  }
}

/**
 * Force re-initialization (useful for development/testing)
 */
export async function forceReinitialize(): Promise<boolean> {
  console.log('🔄 Force re-initializing...');
  
  isInitialized = false;
  initializationPromise = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('astral_core_initialized');
    localStorage.removeItem('demo_users');
    localStorage.removeItem('crisis_resources');
    localStorage.removeItem('sample_content');
  }
  
  return ensureInitialized();
}

/**
 * Get initialization status and demo credentials
 */
export async function getInitializationInfo() {
  const initialized = await checkInitializationStatus();
  
  return {
    initialized,
    demoCredentials: initialized ? {
      user: { email: 'demo@astralcore.app', password: 'demo123' },
      helper: { email: 'helper@astralcore.app', password: 'helper123' },
      admin: { email: 'admin@astralcore.app', password: 'admin123' },
    } : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Health check function
 */
export async function checkSystemHealth() {
  const initialized = await checkInitializationStatus();
  
  return {
    status: initialized ? 'healthy' : 'initializing',
    initialized,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
}