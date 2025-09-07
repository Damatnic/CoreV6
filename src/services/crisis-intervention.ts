// Crisis Intervention Service
// Handles crisis detection, intervention, and resource provision

import { PrismaClient } from '@prisma/client';
import { 
  CrisisProtocol, 
  CrisisAction, 
  CrisisResource
} from '@/types/community';

const prisma = new PrismaClient();

// Crisis detection patterns
const CRISIS_PATTERNS = {
  immediate: {
    keywords: [
      'kill myself', 'end my life', 'suicide', 'want to die',
      'better off dead', 'no reason to live', 'final goodbye',
      'last words', 'end it all', 'overdose'
    ],
    behaviors: [
      'repeated_crisis_messages',
      'isolation_pattern',
      'goodbye_messages',
      'giving_away_possessions'
    ],
    severity: 'critical' as const,
  },
  high: {
    keywords: [
      'self harm', 'cutting', 'hurt myself', 'worthless',
      'hopeless', 'no one cares', 'burden', 'alone forever',
      'cant go on', 'nothing matters'
    ],
    behaviors: [
      'withdrawal_from_support',
      'mood_decline_pattern',
      'substance_mentions',
      'relationship_crisis'
    ],
    severity: 'high' as const,
  },
  medium: {
    keywords: [
      'depressed', 'anxious', 'panic', 'scared',
      'overwhelmed', 'cant cope', 'breaking down',
      'falling apart', 'losing control'
    ],
    behaviors: [
      'seeking_support',
      'expressing_distress',
      'asking_for_help'
    ],
    severity: 'medium' as const,
  },
};

// Global crisis resources
const GLOBAL_CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'us_988',
    type: 'hotline',
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 crisis support in the United States',
    contact: '988',
    available24x7: true,
    languages: ['en', 'es'],
    countries: ['US'],
    specializations: ['suicide_prevention', 'crisis_support', 'mental_health'],
  },
  {
    id: 'us_crisis_text',
    type: 'chat',
    name: 'Crisis Text Line',
    description: 'Free, 24/7 text support',
    contact: 'Text HOME to 741741',
    available24x7: true,
    languages: ['en', 'es'],
    countries: ['US', 'CA', 'UK', 'IE'],
    specializations: ['crisis_support', 'anxiety', 'depression', 'self_harm'],
  },
  {
    id: 'uk_samaritans',
    type: 'hotline',
    name: 'Samaritans',
    description: '24/7 emotional support in the UK and Ireland',
    contact: '116 123',
    available24x7: true,
    languages: ['en'],
    countries: ['UK', 'IE'],
    specializations: ['emotional_support', 'crisis_support'],
  },
  {
    id: 'ca_talk_suicide',
    type: 'hotline',
    name: 'Talk Suicide Canada',
    description: '24/7 suicide prevention service',
    contact: '1-833-456-4566',
    available24x7: true,
    languages: ['en', 'fr'],
    countries: ['CA'],
    specializations: ['suicide_prevention', 'crisis_support'],
  },
  {
    id: 'au_lifeline',
    type: 'hotline',
    name: 'Lifeline Australia',
    description: '24/7 crisis support and suicide prevention',
    contact: '13 11 14',
    available24x7: true,
    languages: ['en'],
    countries: ['AU'],
    specializations: ['crisis_support', 'suicide_prevention'],
  },
  {
    id: 'intl_befrienders',
    type: 'website',
    name: 'Befrienders Worldwide',
    description: 'International directory of emotional support centers',
    contact: 'https://www.befrienders.org',
    available24x7: true,
    languages: ['multiple'],
    countries: ['INTL'],
    specializations: ['emotional_support', 'crisis_support'],
  },
];

export class CrisisInterventionService {
  /**
   * Detect crisis indicators in text
   */
  static async detectCrisis(
    content: string,
    userId: string,
    context: string = 'unknown'
  ): Promise<{
    isCrisis: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    resources: CrisisResource[];
    protocol?: CrisisProtocol;
  }> {
    const lowerContent = content.toLowerCase();
    const indicators: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for immediate crisis patterns
    for (const keyword of CRISIS_PATTERNS.immediate.keywords) {
      if (lowerContent.includes(keyword)) {
        indicators.push(`crisis_keyword: ${keyword}`);
        severity = 'critical';
        break;
      }
    }

    // Check for high-risk patterns if not immediate
    if (severity !== 'critical') {
      for (const keyword of CRISIS_PATTERNS.high.keywords) {
        if (lowerContent.includes(keyword)) {
          indicators.push(`high_risk_keyword: ${keyword}`);
          severity = 'high';
        }
      }
    }

    // Check for medium-risk patterns if not high or critical
    if (severity === 'low') {
      for (const keyword of CRISIS_PATTERNS.medium.keywords) {
        if (lowerContent.includes(keyword)) {
          indicators.push(`distress_keyword: ${keyword}`);
          severity = 'medium';
        }
      }
    }

    // Check user history for patterns
    const userHistory = await this.getUserCrisisHistory(userId);
    if (userHistory.recentAlerts > 3) {
      indicators.push('repeated_crisis_pattern');
      if (severity === 'medium') severity = 'high';
    }

    const isCrisis = severity !== 'low';

    // Get appropriate resources
    const resources = await this.getResourcesForSeverity(severity, userId);

    // Get or create protocol
    let protocol: CrisisProtocol | undefined;
    if (isCrisis) {
      protocol = await this.getProtocol(severity, indicators);
      
      // Create safety alert
      await this.createSafetyAlert({
        userId,
        severity,
        indicators,
        context,
      });

      // Execute immediate actions if critical
      if (severity === 'critical') {
        await this.executeImmediateActions(userId, protocol);
      }
    }

    return {
      isCrisis,
      severity,
      indicators,
      resources,
      protocol,
    };
  }

  /**
   * Get user's crisis history
   */
  static async getUserCrisisHistory(userId: string): Promise<{
    recentAlerts: number;
    lastAlert?: Date;
    pattern?: string;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const alerts = await prisma.safetyAlert.findMany({
      where: {
        userId,
        detectedAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        detectedAt: 'desc',
      },
    });

    const recentAlerts = alerts.length;
    const lastAlert = alerts[0]?.detectedAt;

    // Detect patterns
    let pattern: string | undefined;
    if (recentAlerts > 10) {
      pattern = 'frequent_crisis';
    } else if (recentAlerts > 5) {
      pattern = 'escalating';
    } else if (recentAlerts > 0) {
      const daysSinceLastAlert = lastAlert
        ? Math.floor((Date.now() - lastAlert.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (daysSinceLastAlert < 7) {
        pattern = 'recent_crisis';
      }
    }

    return {
      recentAlerts,
      lastAlert,
      pattern,
    };
  }

  /**
   * Get appropriate resources based on severity
   */
  static async getResourcesForSeverity(
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId: string
  ): Promise<CrisisResource[]> {
    // Get user's location and language preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        preferredLanguage: true,
        timezone: true,
      },
    });

    const userLang = user?.preferredLanguage || 'en';
    const userCountry = this.getCountryFromTimezone(user?.timezone || 'UTC');

    // Filter resources based on severity and user preferences
    let resources = GLOBAL_CRISIS_RESOURCES.filter(resource => {
      const langMatch = resource.languages.includes(userLang) || 
                       resource.languages.includes('multiple');
      const countryMatch = resource.countries?.includes(userCountry) || 
                          resource.countries?.includes('INTL');
      
      return langMatch && countryMatch;
    });

    // Prioritize resources based on severity
    if (severity === 'critical' || severity === 'high') {
      // Prioritize hotlines and immediate chat support
      resources = resources.sort((a, b) => {
        const priority: Record<string, number> = {
          'hotline': 1,
          'chat': 2,
          'text': 2,
          'emergency': 1,
          'website': 3,
          'app': 4,
          'local_service': 5,
        };
        return (priority[a.type] || 6) - (priority[b.type] || 6);
      });
    }

    // Limit to top 5 most relevant resources
    return resources.slice(0, 5);
  }

  /**
   * Get crisis protocol based on severity
   */
  static async getProtocol(
    severity: 'low' | 'medium' | 'high' | 'critical',
    indicators: string[]
  ): Promise<CrisisProtocol> {
    const immediateActions: CrisisAction[] = [];
    const followUpActions: CrisisAction[] = [];

    if (severity === 'critical') {
      immediateActions.push(
        {
          id: 'notify_moderator_1',
          type: 'notify_moderator',
          priority: 1,
          description: 'Alert crisis response team immediately',
          automated: true,
          conditions: []
        },
        {
          id: 'provide_resources_1',
          type: 'provide_resources',
          priority: 1,
          description: 'Display crisis hotlines and chat support',
          automated: true,
          conditions: []
        },
        {
          id: 'connect_counselor_1',
          type: 'connect_counselor',
          priority: 1,
          description: 'Attempt to connect with available crisis counselor',
          automated: true,
          conditions: []
        }
      );
      
      followUpActions.push(
        {
          id: 'connect_counselor_2',
          type: 'connect_counselor',
          priority: 2,
          description: 'Schedule follow-up with mental health professional',
          automated: false,
          conditions: []
        }
      );
    } else if (severity === 'high') {
      immediateActions.push(
        {
          id: 'provide_resources_2',
          type: 'provide_resources',
          priority: 2,
          description: 'Show relevant support resources',
          automated: true,
          conditions: []
        },
        {
          id: 'notify_moderator_2',
          type: 'notify_moderator',
          priority: 2,
          description: 'Flag for moderator review',
          automated: true,
          conditions: []
        }
      );
      
      followUpActions.push(
        {
          id: 'connect_counselor_3',
          type: 'connect_counselor',
          priority: 3,
          description: 'Offer connection to peer support',
          automated: false,
          conditions: []
        }
      );
    } else {
      immediateActions.push(
        {
          id: 'provide_resources_3',
          type: 'provide_resources',
          priority: 3,
          description: 'Suggest helpful resources',
          automated: true,
          conditions: []
        }
      );
    }

    const resources = await this.getResourcesForSeverity(severity, '');

    return {
      id: `protocol_${Date.now()}`,
      triggerType: 'keyword',
      indicators,
      immediateActions,
      followUpActions,
      resources,
      escalationPath: [
        {
          level: 1,
          condition: 'No response within 5 minutes',
          action: 'Escalate to senior moderator',
          notifyList: ['senior_moderator'],
          timeframe: 5,
        },
        {
          level: 2,
          condition: 'Continued crisis indicators',
          action: 'Contact emergency services if location known',
          notifyList: ['crisis_team', 'admin'],
          timeframe: 15,
        },
      ],
    };
  }

  /**
   * Create safety alert
   */
  static async createSafetyAlert(params: {
    userId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
    context: string;
  }): Promise<void> {
    await prisma.safetyAlert.create({
      data: {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: params.severity === 'critical' ? 'crisis' : 'self_harm',
        severity: params.severity,
        userId: params.userId,
        context: params.context,
        indicators: params.indicators,
        handled: false,
        actions: ['auto_detected', 'resources_provided'],
      },
    });
  }

  /**
   * Execute immediate crisis actions
   */
  static async executeImmediateActions(
    userId: string,
    protocol: CrisisProtocol
  ): Promise<void> {
    if (protocol.immediateActions) {
      for (const action of protocol.immediateActions) {
        if (action.automated) {
          switch (action.type) {
            case 'notify_moderator':
              const priorityLevel = action.priority === 1 ? 'immediate' : action.priority === 2 ? 'urgent' : 'standard';
              await CrisisInterventionService.notifyModerators(userId, priorityLevel);
              break;
            
            case 'provide_resources':
              // Resources are returned with the detection result
              break;
            
            case 'connect_counselor':
              // Counselor connection logic
              break;
          }
        }
      }
    }
  }

  /**
   * Notify moderators about crisis
   */
  static async notifyModerators(
    userId: string,
    priority: 'immediate' | 'urgent' | 'standard'
  ): Promise<void> {
    // Get all active moderators
    const moderators = await prisma.user.findMany({
      where: {
        role: { in: ['HELPER', 'CRISIS_COUNSELOR', 'ADMIN', 'SUPER_ADMIN'] },
        lastActiveAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000), // Active in last 30 minutes
        },
      },
    });

    // Create notifications for moderators
    const notifications = moderators.map((mod: any) => ({
      id: `crisis-${userId}-${mod.id}-${Date.now()}`,
      userId: mod.id,
      type: 'crisis_alert',
      title: `${priority.toUpperCase()} Crisis Alert`,
      message: `User requires immediate assistance`,
      isPriority: priority === 'immediate',
      metadata: {
        affectedUserId: userId,
        priority,
      },
    }));

    await prisma.notification.createMany({
      data: notifications,
    });
  }

  /**
   * Get country from timezone
   */
  static getCountryFromTimezone(timezone: string): string {
    const timezoneCountryMap: Record<string, string> = {
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Denver': 'US',
      'America/Toronto': 'CA',
      'America/Vancouver': 'CA',
      'Europe/London': 'UK',
      'Europe/Dublin': 'IE',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'Europe/Madrid': 'ES',
      'Europe/Lisbon': 'PT',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
    };

    return timezoneCountryMap[timezone] || 'US';
  }
}

export default CrisisInterventionService;
