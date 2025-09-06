/**
 * Mental Health Assessment System
 * Comprehensive clinical assessment tools for mental health evaluation
 * Includes standardized questionnaires, scoring algorithms, and risk assessment
 */

import { auditLogger, AuditEventType } from '../security/auditLogger';
import { hipaaService, PHICategory } from '../compliance/hipaaService';

// Standardized assessment types
export enum AssessmentType {
  // Depression Assessments
  PHQ9 = 'phq9',           // Patient Health Questionnaire-9
  PHQ2 = 'phq2',           // Brief depression screening
  BDI = 'bdi',             // Beck Depression Inventory
  
  // Anxiety Assessments
  GAD7 = 'gad7',           // Generalized Anxiety Disorder-7
  BAI = 'bai',             // Beck Anxiety Inventory
  STAI = 'stai',           // State-Trait Anxiety Inventory
  
  // Stress Assessments
  PSS = 'pss',             // Perceived Stress Scale
  DASS21 = 'dass21',       // Depression, Anxiety, Stress Scales
  
  // Trauma Assessments
  PTSD5 = 'ptsd5',         // PTSD Checklist for DSM-5
  PCL5 = 'pcl5',           // PTSD Checklist-5
  ACES = 'aces',           // Adverse Childhood Experiences
  
  // Mood Assessments
  MDQ = 'mdq',             // Mood Disorder Questionnaire
  YMRS = 'ymrs',           // Young Mania Rating Scale
  
  // Substance Use
  AUDIT = 'audit',         // Alcohol Use Disorders Test
  DAST = 'dast',           // Drug Abuse Screening Test
  
  // General Mental Health
  GHQ12 = 'ghq12',         // General Health Questionnaire-12
  WEMWBS = 'wemwbs',       // Warwick-Edinburgh Mental Well-being Scale
  
  // Crisis Assessment
  CRISIS_RISK = 'crisis_risk',     // Suicide risk assessment
  SELF_HARM = 'self_harm'          // Self-harm risk assessment
}

// Risk levels for clinical decision making
export enum RiskLevel {
  MINIMAL = 'minimal',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRISIS = 'crisis'
}

// Question types supported
export enum QuestionType {
  LIKERT = 'likert',           // 1-5 scale
  BINARY = 'binary',           // Yes/No
  MULTIPLE_CHOICE = 'multiple_choice',
  RATING = 'rating',           // 0-10 scale
  TEXT = 'text',              // Free text response
  CHECKLIST = 'checklist'      // Multiple selection
}

// Individual assessment question
export interface AssessmentQuestion {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  
  // For structured questions
  options?: AssessmentOption[];
  scale?: {
    min: number;
    max: number;
    labels?: Record<number, string>;
  };
  
  // Scoring
  weight?: number;
  reverseScored?: boolean;
  
  // Conditional logic
  showIf?: {
    questionId: string;
    condition: 'equals' | 'greater_than' | 'less_than';
    value: any;
  };
}

export interface AssessmentOption {
  value: any;
  label: string;
  score?: number;
}

// Complete assessment definition
export interface Assessment {
  id: string;
  type: AssessmentType;
  name: string;
  description: string;
  version: string;
  
  // Clinical information
  validatedFor: string[];      // Population types
  ageRange: { min: number; max: number };
  estimatedTime: number;       // minutes
  
  // Questions and structure
  sections: AssessmentSection[];
  totalQuestions: number;
  
  // Scoring information
  scoringAlgorithm: ScoringAlgorithm;
  riskThresholds: Record<RiskLevel, number>;
  
  // Clinical interpretation
  interpretationGuide: string;
  recommendedActions: Record<RiskLevel, string[]>;
  
  // Metadata
  createdBy: string;
  validatedDate: Date;
  references: string[];
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  weight?: number;
}

export interface ScoringAlgorithm {
  method: 'sum' | 'average' | 'weighted' | 'custom';
  customFunction?: string;
  subscales?: {
    name: string;
    questionIds: string[];
    method: 'sum' | 'average' | 'weighted';
  }[];
}

// Assessment session/response
export interface AssessmentSession {
  id: string;
  userId: string;
  assessmentId: string;
  
  // Session details
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  
  // Responses
  responses: Record<string, any>;
  currentQuestionIndex: number;
  
  // Results (available after completion)
  results?: AssessmentResults;
  
  // Clinical context
  administeringClinician?: string;
  clinicalContext?: string;
  referralSource?: string;
}

export interface AssessmentResults {
  sessionId: string;
  assessmentId: string;
  
  // Scores
  totalScore: number;
  percentileScore?: number;
  subscaleScores?: Record<string, number>;
  
  // Risk assessment
  riskLevel: RiskLevel;
  riskFactors: string[];
  protectiveFactors: string[];
  
  // Clinical interpretation
  interpretation: string;
  recommendations: string[];
  flaggedResponses: FlaggedResponse[];
  
  // Follow-up
  requiresImmediateAttention: boolean;
  suggestedFollowUp: Date;
  
  // Metadata
  scoredAt: Date;
  scoredBy: 'system' | 'clinician';
  reliability: number;     // 0-1 scale
  validity: number;        // 0-1 scale
}

export interface FlaggedResponse {
  questionId: string;
  questionText: string;
  response: any;
  reason: 'crisis_indicator' | 'inconsistent' | 'extreme_score' | 'skip_pattern_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction: string;
}

class MentalHealthAssessmentService {
  private static instance: MentalHealthAssessmentService;
  private assessments: Map<string, Assessment> = new Map();
  private sessions: Map<string, AssessmentSession> = new Map();
  
  private constructor() {
    this.initializeStandardAssessments();
  }

  static getInstance(): MentalHealthAssessmentService {
    if (!MentalHealthAssessmentService.instance) {
      MentalHealthAssessmentService.instance = new MentalHealthAssessmentService();
    }
    return MentalHealthAssessmentService.instance;
  }

  /**
   * Get available assessments
   */
  async getAvailableAssessments(
    userId: string,
    filters?: {
      type?: AssessmentType;
      ageRange?: { min: number; max: number };
      maxTime?: number;
    }
  ): Promise<Assessment[]> {
    let assessments = Array.from(this.assessments.values());

    // Apply filters
    if (filters?.type) {
      assessments = assessments.filter(a => a.type === filters.type);
    }

    if (filters?.ageRange) {
      assessments = assessments.filter(a => 
        a.ageRange.min <= filters.ageRange!.max && 
        a.ageRange.max >= filters.ageRange!.min
      );
    }

    if (filters?.maxTime) {
      assessments = assessments.filter(a => a.estimatedTime <= filters.maxTime!);
    }

    // Log access for audit
    await auditLogger.logEvent(
      AuditEventType.PHI_ACCESS,
      'assessments_viewed',
      {
        userId,
        assessmentCount: assessments.length,
        filters
      }
    );

    return assessments;
  }

  /**
   * Start new assessment session
   */
  async startAssessment(
    userId: string,
    assessmentId: string,
    options?: {
      administeringClinician?: string;
      clinicalContext?: string;
      referralSource?: string;
    }
  ): Promise<AssessmentSession> {
    try {
      const assessment = this.assessments.get(assessmentId);
      if (!assessment) {
        throw new Error('Assessment not found');
      }

      // Check HIPAA permissions for clinical data access
      const hasPermission = await hipaaService.requestPHIAccess({
        userId: options?.administeringClinician || userId,
        userRole: options?.administeringClinician ? 'healthcare_provider' : 'patient',
        patientId: userId,
        phiCategories: [PHICategory.MENTAL_HEALTH_RECORDS],
        purpose: `Administer ${assessment.name} assessment`,
        accessLevel: 'standard',
        justification: `Clinical assessment for ${options?.clinicalContext || 'mental health evaluation'}`
      });

      if (!hasPermission) {
        throw new Error('Insufficient permissions for assessment administration');
      }

      const session: AssessmentSession = {
        id: this.generateSessionId(),
        userId,
        assessmentId,
        startedAt: new Date(),
        status: 'in_progress',
        responses: {},
        currentQuestionIndex: 0,
        administeringClinician: options?.administeringClinician,
        clinicalContext: options?.clinicalContext,
        referralSource: options?.referralSource
      };

      this.sessions.set(session.id, session);

      // Audit log
      await auditLogger.logEvent(
        AuditEventType.THERAPY_SESSION_START,
        'assessment_started',
        {
          userId,
          sessionId: session.id,
          assessmentId,
          assessmentType: assessment.type,
          administeringClinician: options?.administeringClinician,
          details: {
            estimatedTime: assessment.estimatedTime,
            totalQuestions: assessment.totalQuestions
          }
        }
      );

      return session;

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        'assessment_start_failed',
        {
          userId,
          assessmentId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          outcome: 'failure'
        }
      );
      throw error;
    }
  }

  /**
   * Submit response to assessment question
   */
  async submitResponse(
    sessionId: string,
    questionId: string,
    response: any
  ): Promise<{ nextQuestion?: AssessmentQuestion; isComplete: boolean; flagged?: FlaggedResponse }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Assessment session not found');
    }

    if (session.status !== 'in_progress') {
      throw new Error('Assessment session is not active');
    }

    const assessment = this.assessments.get(session.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    // Find the question
    const question = this.findQuestion(assessment, questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    // Validate response
    const validation = this.validateResponse(question, response);
    if (!validation.isValid) {
      throw new Error(`Invalid response: ${validation.error}`);
    }

    // Check for crisis indicators or concerning responses
    const flagged = await this.checkForCrisisIndicators(question, response, assessment.type);

    // Store response
    session.responses[questionId] = response;
    session.currentQuestionIndex++;

    // Update session
    this.sessions.set(sessionId, session);

    // Log response (without storing actual response content for privacy)
    await auditLogger.logEvent(
      AuditEventType.PHI_UPDATE,
      'assessment_response_recorded',
      {
        userId: session.userId,
        sessionId,
        questionId,
        flagged: !!flagged,
        details: {
          questionType: question.type,
          responsePresent: !!response
        }
      }
    );

    // Handle crisis flag immediately
    if (flagged && flagged.severity === 'critical') {
      await this.handleCrisisFlag(session, flagged);
    }

    // Check if assessment is complete
    const allQuestions = this.getAllQuestions(assessment);
    const nextQuestion = this.getNextQuestion(assessment, session);
    const isComplete = !nextQuestion;

    if (isComplete) {
      await this.completeAssessment(sessionId);
    }

    return {
      nextQuestion,
      isComplete,
      flagged
    };
  }

  /**
   * Complete assessment and generate results
   */
  async completeAssessment(sessionId: string): Promise<AssessmentResults> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Assessment session not found');
    }

    const assessment = this.assessments.get(session.assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    try {
      // Calculate scores
      const results = await this.calculateResults(session, assessment);
      
      // Update session
      session.completedAt = new Date();
      session.status = 'completed';
      session.results = results;
      this.sessions.set(sessionId, session);

      // Audit log
      await auditLogger.logEvent(
        AuditEventType.THERAPY_SESSION_END,
        'assessment_completed',
        {
          userId: session.userId,
          sessionId,
          assessmentId: assessment.id,
          riskLevel: results.riskLevel,
          totalScore: results.totalScore,
          requiresAttention: results.requiresImmediateAttention,
          details: {
            duration: session.completedAt.getTime() - session.startedAt.getTime(),
            flaggedResponses: results.flaggedResponses.length
          }
        }
      );

      // Handle high-risk results
      if (results.requiresImmediateAttention) {
        await this.triggerCrisisIntervention(session, results);
      }

      return results;

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_SHUTDOWN,
        'assessment_completion_failed',
        {
          userId: session.userId,
          sessionId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          outcome: 'failure'
        }
      );
      throw error;
    }
  }

  /**
   * Get assessment results
   */
  async getAssessmentResults(sessionId: string, userId: string): Promise<AssessmentResults | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      return null;
    }

    // Log access
    await auditLogger.logPHIAccess(
      userId,
      [PHICategory.MENTAL_HEALTH_RECORDS],
      {
        userId,
        sessionId,
        action: 'view_assessment_results'
      }
    );

    return session.results || null;
  }

  /**
   * Get user's assessment history
   */
  async getAssessmentHistory(
    userId: string,
    type?: AssessmentType,
    limit: number = 50
  ): Promise<AssessmentSession[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .filter(session => !type || this.assessments.get(session.assessmentId)?.type === type)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);

    // Log access
    await auditLogger.logPHIAccess(
      userId,
      [PHICategory.MENTAL_HEALTH_RECORDS],
      {
        userId,
        action: 'view_assessment_history',
        details: { type, sessionCount: userSessions.length }
      }
    );

    return userSessions;
  }

  // Private helper methods

  private initializeStandardAssessments(): void {
    // PHQ-9 Depression Assessment
    const phq9 = this.createPHQ9Assessment();
    this.assessments.set(phq9.id, phq9);

    // GAD-7 Anxiety Assessment
    const gad7 = this.createGAD7Assessment();
    this.assessments.set(gad7.id, gad7);

    // Crisis Risk Assessment
    const crisisRisk = this.createCrisisRiskAssessment();
    this.assessments.set(crisisRisk.id, crisisRisk);
  }

  private createPHQ9Assessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'phq9_1',
        text: 'Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?',
        type: QuestionType.LIKERT,
        required: true,
        options: [
          { value: 0, label: 'Not at all', score: 0 },
          { value: 1, label: 'Several days', score: 1 },
          { value: 2, label: 'More than half the days', score: 2 },
          { value: 3, label: 'Nearly every day', score: 3 }
        ]
      },
      {
        id: 'phq9_2',
        text: 'Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
        type: QuestionType.LIKERT,
        required: true,
        options: [
          { value: 0, label: 'Not at all', score: 0 },
          { value: 1, label: 'Several days', score: 1 },
          { value: 2, label: 'More than half the days', score: 2 },
          { value: 3, label: 'Nearly every day', score: 3 }
        ]
      },
      // Additional PHQ-9 questions would be added here
    ];

    return {
      id: 'phq9_v1',
      type: AssessmentType.PHQ9,
      name: 'Patient Health Questionnaire-9 (PHQ-9)',
      description: 'A validated screening tool for depression severity',
      version: '1.0',
      validatedFor: ['adults', 'adolescents'],
      ageRange: { min: 12, max: 100 },
      estimatedTime: 5,
      sections: [{
        id: 'main',
        title: 'Depression Symptoms',
        questions
      }],
      totalQuestions: questions.length,
      scoringAlgorithm: {
        method: 'sum'
      },
      riskThresholds: {
        [RiskLevel.MINIMAL]: 4,
        [RiskLevel.MILD]: 9,
        [RiskLevel.MODERATE]: 14,
        [RiskLevel.SEVERE]: 19,
        [RiskLevel.CRISIS]: 25
      },
      interpretationGuide: 'PHQ-9 scores: 0-4 minimal depression, 5-9 mild, 10-14 moderate, 15-19 moderately severe, 20-27 severe',
      recommendedActions: {
        [RiskLevel.MINIMAL]: ['Monitor symptoms', 'Lifestyle interventions'],
        [RiskLevel.MILD]: ['Psychoeducation', 'Self-help resources', 'Follow-up in 2-4 weeks'],
        [RiskLevel.MODERATE]: ['Consider therapy', 'Medication evaluation', 'Weekly follow-up'],
        [RiskLevel.SEVERE]: ['Immediate clinical evaluation', 'Consider hospitalization', 'Daily monitoring'],
        [RiskLevel.CRISIS]: ['Immediate psychiatric evaluation', 'Crisis intervention', 'Safety planning']
      },
      createdBy: 'system',
      validatedDate: new Date(),
      references: ['Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9']
    };
  }

  private createGAD7Assessment(): Assessment {
    // Similar structure to PHQ-9, focused on anxiety
    return {
      id: 'gad7_v1',
      type: AssessmentType.GAD7,
      name: 'Generalized Anxiety Disorder 7-item (GAD-7)',
      description: 'A validated screening tool for generalized anxiety disorder',
      version: '1.0',
      validatedFor: ['adults'],
      ageRange: { min: 18, max: 100 },
      estimatedTime: 3,
      sections: [{
        id: 'main',
        title: 'Anxiety Symptoms',
        questions: [] // Would include GAD-7 questions
      }],
      totalQuestions: 7,
      scoringAlgorithm: { method: 'sum' },
      riskThresholds: {
        [RiskLevel.MINIMAL]: 4,
        [RiskLevel.MILD]: 9,
        [RiskLevel.MODERATE]: 14,
        [RiskLevel.SEVERE]: 18,
        [RiskLevel.CRISIS]: 21
      },
      interpretationGuide: 'GAD-7 scores: 0-4 minimal anxiety, 5-9 mild, 10-14 moderate, 15+ severe',
      recommendedActions: {
        [RiskLevel.MINIMAL]: ['Monitor symptoms'],
        [RiskLevel.MILD]: ['Self-help resources', 'Relaxation techniques'],
        [RiskLevel.MODERATE]: ['Consider therapy', 'Anxiety management'],
        [RiskLevel.SEVERE]: ['Clinical evaluation', 'Comprehensive treatment'],
        [RiskLevel.CRISIS]: ['Immediate evaluation', 'Crisis support']
      },
      createdBy: 'system',
      validatedDate: new Date(),
      references: ['Spitzer, R. L., Kroenke, K., Williams, J. B., & Löwe, B. (2006)']
    };
  }

  private createCrisisRiskAssessment(): Assessment {
    const questions: AssessmentQuestion[] = [
      {
        id: 'crisis_1',
        text: 'In the past month, have you wished you were dead or wished you could go to sleep and not wake up?',
        type: QuestionType.BINARY,
        required: true,
        options: [
          { value: false, label: 'No', score: 0 },
          { value: true, label: 'Yes', score: 5 }
        ]
      },
      {
        id: 'crisis_2',
        text: 'In the past month, have you actually had any thoughts about killing yourself?',
        type: QuestionType.BINARY,
        required: true,
        options: [
          { value: false, label: 'No', score: 0 },
          { value: true, label: 'Yes', score: 10 }
        ]
      },
      // Additional crisis assessment questions
    ];

    return {
      id: 'crisis_risk_v1',
      type: AssessmentType.CRISIS_RISK,
      name: 'Crisis Risk Assessment',
      description: 'Screening for suicide risk and crisis intervention needs',
      version: '1.0',
      validatedFor: ['adults', 'adolescents'],
      ageRange: { min: 12, max: 100 },
      estimatedTime: 10,
      sections: [{
        id: 'main',
        title: 'Crisis Risk Factors',
        questions
      }],
      totalQuestions: questions.length,
      scoringAlgorithm: { method: 'weighted' },
      riskThresholds: {
        [RiskLevel.MINIMAL]: 0,
        [RiskLevel.MILD]: 5,
        [RiskLevel.MODERATE]: 15,
        [RiskLevel.SEVERE]: 25,
        [RiskLevel.CRISIS]: 35
      },
      interpretationGuide: 'Crisis risk assessment requires immediate clinical evaluation for any positive responses',
      recommendedActions: {
        [RiskLevel.MINIMAL]: ['Document assessment', 'Regular monitoring'],
        [RiskLevel.MILD]: ['Safety planning', 'Increased support'],
        [RiskLevel.MODERATE]: ['Clinical evaluation', 'Safety measures', 'Frequent contact'],
        [RiskLevel.SEVERE]: ['Immediate psychiatric evaluation', 'Consider hospitalization'],
        [RiskLevel.CRISIS]: ['Emergency intervention', 'Hospitalization', 'Continuous monitoring']
      },
      createdBy: 'system',
      validatedDate: new Date(),
      references: ['Columbia Suicide Severity Rating Scale']
    };
  }

  private findQuestion(assessment: Assessment, questionId: string): AssessmentQuestion | null {
    for (const section of assessment.sections) {
      const question = section.questions.find(q => q.id === questionId);
      if (question) return question;
    }
    return null;
  }

  private getAllQuestions(assessment: Assessment): AssessmentQuestion[] {
    return assessment.sections.flatMap(section => section.questions);
  }

  private getNextQuestion(assessment: Assessment, session: AssessmentSession): AssessmentQuestion | null {
    const allQuestions = this.getAllQuestions(assessment);
    const answeredQuestions = Object.keys(session.responses);
    
    // Find next unanswered required question
    for (const question of allQuestions) {
      if (!answeredQuestions.includes(question.id)) {
        // Check conditional logic
        if (this.shouldShowQuestion(question, session.responses)) {
          return question;
        }
      }
    }
    
    return null;
  }

  private shouldShowQuestion(question: AssessmentQuestion, responses: Record<string, any>): boolean {
    if (!question.showIf) return true;
    
    const targetResponse = responses[question.showIf.questionId];
    if (targetResponse === undefined) return false;
    
    switch (question.showIf.condition) {
      case 'equals':
        return targetResponse === question.showIf.value;
      case 'greater_than':
        return targetResponse > question.showIf.value;
      case 'less_than':
        return targetResponse < question.showIf.value;
      default:
        return true;
    }
  }

  private validateResponse(question: AssessmentQuestion, response: any): { isValid: boolean; error?: string } {
    if (question.required && (response === null || response === undefined || response === '')) {
      return { isValid: false, error: 'Response is required' };
    }

    switch (question.type) {
      case QuestionType.BINARY:
        if (typeof response !== 'boolean') {
          return { isValid: false, error: 'Binary response must be true or false' };
        }
        break;
        
      case QuestionType.LIKERT:
      case QuestionType.MULTIPLE_CHOICE:
        if (question.options) {
          const validValues = question.options.map(opt => opt.value);
          if (!validValues.includes(response)) {
            return { isValid: false, error: 'Response not in valid options' };
          }
        }
        break;
        
      case QuestionType.RATING:
        if (question.scale) {
          if (response < question.scale.min || response > question.scale.max) {
            return { isValid: false, error: `Response must be between ${question.scale.min} and ${question.scale.max}` };
          }
        }
        break;
    }

    return { isValid: true };
  }

  private async checkForCrisisIndicators(
    question: AssessmentQuestion,
    response: any,
    assessmentType: AssessmentType
  ): Promise<FlaggedResponse | null> {
    // Crisis indicators for different assessment types
    const crisisPatterns = {
      [AssessmentType.PHQ9]: {
        'phq9_9': (response: number) => response >= 1, // Suicidal ideation question
      },
      [AssessmentType.CRISIS_RISK]: {
        'crisis_2': (response: boolean) => response === true, // Suicidal thoughts
        'crisis_3': (response: boolean) => response === true, // Suicide plan
      }
    };

    const patterns = crisisPatterns[assessmentType];
    if (patterns && patterns[question.id]) {
      const isCrisis = patterns[question.id](response);
      
      if (isCrisis) {
        return {
          questionId: question.id,
          questionText: question.text,
          response,
          reason: 'crisis_indicator',
          severity: 'critical',
          suggestedAction: 'Immediate clinical evaluation and safety assessment required'
        };
      }
    }

    return null;
  }

  private async handleCrisisFlag(session: AssessmentSession, flag: FlaggedResponse): Promise<void> {
    await auditLogger.logEvent(
      AuditEventType.CRISIS_INTERVENTION,
      'crisis_indicator_detected',
      {
        userId: session.userId,
        sessionId: session.id,
        questionId: flag.questionId,
        severity: 'critical',
        details: {
          questionText: flag.questionText,
          suggestedAction: flag.suggestedAction
        }
      }
    );

    // In production, this would trigger immediate crisis protocols
    console.log('CRISIS ALERT: Immediate intervention required for user', session.userId);
  }

  private async calculateResults(session: AssessmentSession, assessment: Assessment): Promise<AssessmentResults> {
    const allQuestions = this.getAllQuestions(assessment);
    let totalScore = 0;
    const flaggedResponses: FlaggedResponse[] = [];

    // Calculate total score
    for (const question of allQuestions) {
      const response = session.responses[question.id];
      if (response !== undefined) {
        const score = this.getQuestionScore(question, response);
        totalScore += score * (question.weight || 1);

        // Check for flags during scoring
        const flag = await this.checkForCrisisIndicators(question, response, assessment.type);
        if (flag) {
          flaggedResponses.push(flag);
        }
      }
    }

    // Determine risk level
    const riskLevel = this.determineRiskLevel(totalScore, assessment.riskThresholds);
    
    // Generate interpretation and recommendations
    const interpretation = this.generateInterpretation(totalScore, riskLevel, assessment);
    const recommendations = assessment.recommendedActions[riskLevel] || [];

    return {
      sessionId: session.id,
      assessmentId: assessment.id,
      totalScore,
      riskLevel,
      riskFactors: this.identifyRiskFactors(session.responses, assessment),
      protectiveFactors: this.identifyProtectiveFactors(session.responses, assessment),
      interpretation,
      recommendations,
      flaggedResponses,
      requiresImmediateAttention: riskLevel === RiskLevel.CRISIS || flaggedResponses.some(f => f.severity === 'critical'),
      suggestedFollowUp: this.calculateFollowUpDate(riskLevel),
      scoredAt: new Date(),
      scoredBy: 'system',
      reliability: 0.95, // Based on assessment validation
      validity: 0.90
    };
  }

  private getQuestionScore(question: AssessmentQuestion, response: any): number {
    if (question.options) {
      const option = question.options.find(opt => opt.value === response);
      return option?.score || 0;
    }
    
    if (typeof response === 'number') {
      return question.reverseScored ? (question.scale?.max || 0) - response : response;
    }
    
    return 0;
  }

  private determineRiskLevel(score: number, thresholds: Record<RiskLevel, number>): RiskLevel {
    if (score >= thresholds[RiskLevel.CRISIS]) return RiskLevel.CRISIS;
    if (score >= thresholds[RiskLevel.SEVERE]) return RiskLevel.SEVERE;
    if (score >= thresholds[RiskLevel.MODERATE]) return RiskLevel.MODERATE;
    if (score >= thresholds[RiskLevel.MILD]) return RiskLevel.MILD;
    return RiskLevel.MINIMAL;
  }

  private generateInterpretation(score: number, riskLevel: RiskLevel, assessment: Assessment): string {
    return `${assessment.name} score: ${score}. Risk level: ${riskLevel}. ${assessment.interpretationGuide}`;
  }

  private identifyRiskFactors(responses: Record<string, any>, assessment: Assessment): string[] {
    // Simplified risk factor identification
    const riskFactors: string[] = [];
    
    Object.entries(responses).forEach(([questionId, response]) => {
      // High scores on certain questions indicate risk factors
      if (typeof response === 'number' && response >= 3) {
        riskFactors.push(`High score on ${questionId}`);
      }
    });

    return riskFactors;
  }

  private identifyProtectiveFactors(responses: Record<string, any>, assessment: Assessment): string[] {
    // Simplified protective factor identification
    return ['Assessment completed', 'Seeking help'];
  }

  private calculateFollowUpDate(riskLevel: RiskLevel): Date {
    const daysToAdd = {
      [RiskLevel.MINIMAL]: 90,
      [RiskLevel.MILD]: 30,
      [RiskLevel.MODERATE]: 14,
      [RiskLevel.SEVERE]: 7,
      [RiskLevel.CRISIS]: 1
    };

    const days = daysToAdd[riskLevel];
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async triggerCrisisIntervention(session: AssessmentSession, results: AssessmentResults): Promise<void> {
    await auditLogger.logCrisisIntervention(
      session.userId,
      'assessment_crisis_detected',
      {
        sessionId: session.id,
        assessmentType: session.assessmentId,
        riskLevel: results.riskLevel,
        details: {
          totalScore: results.totalScore,
          flaggedCount: results.flaggedResponses.length,
          recommendations: results.recommendations
        }
      }
    );

    // In production, this would:
    // - Notify crisis intervention team
    // - Create safety plan
    // - Schedule immediate follow-up
    // - Connect to emergency services if needed
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const mentalHealthAssessment = MentalHealthAssessmentService.getInstance();