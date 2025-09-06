/**
 * Therapy Session Management System
 * Comprehensive clinical session management for mental health providers
 * Handles scheduling, documentation, progress tracking, and clinical workflows
 */

import { auditLogger, AuditEventType } from '../security/auditLogger';
import { hipaaService, PHICategory } from '../compliance/hipaaService';
import { fieldEncryption } from '../security/fieldEncryption';

// Session types and modalities
export enum SessionType {
  INDIVIDUAL_THERAPY = 'individual_therapy',
  GROUP_THERAPY = 'group_therapy',
  FAMILY_THERAPY = 'family_therapy',
  COUPLES_THERAPY = 'couples_therapy',
  INTAKE_ASSESSMENT = 'intake_assessment',
  CRISIS_INTERVENTION = 'crisis_intervention',
  FOLLOW_UP = 'follow_up',
  MEDICATION_MANAGEMENT = 'medication_management',
  PSYCHOEDUCATION = 'psychoeducation',
  CONSULTATION = 'consultation'
}

export enum SessionModality {
  IN_PERSON = 'in_person',
  TELEHEALTH = 'telehealth',
  PHONE = 'phone',
  GROUP_VIRTUAL = 'group_virtual',
  HYBRID = 'hybrid'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled'
}

// Clinical documentation standards
export enum DocumentationType {
  PROGRESS_NOTE = 'progress_note',
  TREATMENT_PLAN = 'treatment_plan',
  ASSESSMENT_SUMMARY = 'assessment_summary',
  CRISIS_NOTE = 'crisis_note',
  DISCHARGE_SUMMARY = 'discharge_summary',
  SUPERVISION_NOTE = 'supervision_note',
  CASE_CONSULTATION = 'case_consultation'
}

// Therapy session record
export interface TherapySession {
  id: string;
  
  // Basic session information
  patientId: string;
  therapistId: string;
  supervisorId?: string;
  
  // Session details
  type: SessionType;
  modality: SessionModality;
  status: SessionStatus;
  
  // Scheduling
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  
  // Location/platform
  location?: string;
  platform?: string; // For telehealth
  roomNumber?: string;
  
  // Clinical information
  clinicalFocus: string[];
  interventions: Intervention[];
  assessments: string[]; // Assessment IDs
  
  // Documentation
  progressNotes: ProgressNote[];
  treatmentPlan?: TreatmentPlan;
  homework?: HomeworkAssignment[];
  
  // Session outcomes
  sessionGoals: SessionGoal[];
  outcomeMetrics: OutcomeMetric[];
  riskAssessment: RiskAssessment;
  
  // Administrative
  billingCode?: string;
  insuranceAuthorization?: string;
  copayAmount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  encryptedFields: string[];
}

export interface Intervention {
  id: string;
  type: InterventionType;
  name: string;
  description: string;
  duration: number; // minutes
  effectiveness: 1 | 2 | 3 | 4 | 5;
  patientResponse: string;
  clinicianNotes: string;
}

export enum InterventionType {
  CBT = 'cognitive_behavioral_therapy',
  DBT = 'dialectical_behavior_therapy',
  MINDFULNESS = 'mindfulness',
  EXPOSURE_THERAPY = 'exposure_therapy',
  EMDR = 'emdr',
  PSYCHODYNAMIC = 'psychodynamic',
  HUMANISTIC = 'humanistic',
  SOLUTION_FOCUSED = 'solution_focused',
  MOTIVATIONAL_INTERVIEWING = 'motivational_interviewing',
  CRISIS_INTERVENTION = 'crisis_intervention'
}

export interface ProgressNote {
  id: string;
  sessionId: string;
  type: DocumentationType;
  
  // SOAP format
  subjective: string;    // Patient's subjective report
  objective: string;     // Clinician observations
  assessment: string;    // Clinical assessment
  plan: string;         // Treatment plan updates
  
  // Additional clinical content
  moodStatus: MoodStatus;
  riskFactors: string[];
  protectiveFactors: string[];
  medicationChanges?: MedicationChange[];
  
  // Progress tracking
  goalProgress: GoalProgress[];
  symptomsTracked: SymptomTracking[];
  
  // Administrative
  wordCount: number;
  timeToComplete: number; // minutes
  
  // Security
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  digitalSignature?: string;
  locked: boolean;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  therapistId: string;
  
  // Clinical formulation
  presentingProblem: string;
  clinicalDiagnosis: Diagnosis[];
  formulation: string;
  
  // Goals and objectives
  longTermGoals: TreatmentGoal[];
  shortTermObjectives: TreatmentObjective[];
  
  // Treatment approach
  theoreticalOrientation: string[];
  interventions: InterventionType[];
  frequency: string; // e.g., "weekly", "bi-weekly"
  estimatedDuration: number; // weeks
  
  // Measurement
  outcomeMetrics: string[];
  progressIndicators: string[];
  
  // Plan details
  strengths: string[];
  barriers: string[];
  resources: string[];
  
  // Dates
  createdDate: Date;
  reviewDate: Date;
  lastUpdated: Date;
  
  // Approvals
  clientConsent: boolean;
  supervisorApproval?: boolean;
  insuranceApproval?: boolean;
}

export interface SessionGoal {
  id: string;
  description: string;
  achieved: boolean;
  progress: number; // 0-100%
  notes: string;
}

export interface OutcomeMetric {
  metric: string;
  preSessionValue: number;
  postSessionValue: number;
  scale: string;
  improvement: number;
}

export interface RiskAssessment {
  suicideRisk: RiskLevel;
  selfHarmRisk: RiskLevel;
  homicideRisk: RiskLevel;
  substanceUseRisk: RiskLevel;
  riskFactors: string[];
  protectiveFactors: string[];
  safetyPlan?: SafetyPlan;
  immediateAction: string;
}

export interface SafetyPlan {
  id: string;
  warningSignsPersonal: string[];
  copingStrategies: string[];
  socialContacts: Contact[];
  professionalContacts: Contact[];
  environmentSafety: string[];
  reasons: string[];
  createdDate: Date;
  lastReviewed: Date;
}

export interface Contact {
  name: string;
  relationship: string;
  phone: string;
  available: string;
}

// Enums for clinical documentation
export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  IMMINENT = 'imminent'
}

export interface MoodStatus {
  anxiety: number;      // 1-10 scale
  depression: number;   // 1-10 scale
  irritability: number; // 1-10 scale
  energy: number;       // 1-10 scale
  sleep: number;        // 1-10 scale
  appetite: number;     // 1-10 scale
}

export interface Diagnosis {
  code: string;         // DSM-5 or ICD-10 code
  description: string;
  type: 'primary' | 'secondary' | 'provisional' | 'rule_out';
  onset: string;
  severity: 'mild' | 'moderate' | 'severe';
  specifiers?: string[];
}

export interface TreatmentGoal {
  id: string;
  description: string;
  targetDate: Date;
  progress: number; // 0-100%
  objectives: TreatmentObjective[];
  measurable: boolean;
  status: 'active' | 'achieved' | 'modified' | 'discontinued';
}

export interface TreatmentObjective {
  id: string;
  description: string;
  targetDate: Date;
  progress: number;
  interventions: string[];
  status: 'active' | 'achieved' | 'modified' | 'discontinued';
}

export interface HomeworkAssignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  patientFeedback?: string;
  therapistReview?: string;
  resources: string[];
}

export interface GoalProgress {
  goalId: string;
  previousRating: number;
  currentRating: number;
  notes: string;
}

export interface SymptomTracking {
  symptom: string;
  severity: number; // 1-10
  frequency: string;
  duration: string;
  triggers: string[];
  copingUsed: string[];
}

export interface MedicationChange {
  medication: string;
  change: 'started' | 'stopped' | 'dose_increased' | 'dose_decreased' | 'switched';
  reason: string;
  prescribingProvider: string;
}

class TherapySessionManager {
  private static instance: TherapySessionManager;
  private sessions: Map<string, TherapySession> = new Map();
  private treatmentPlans: Map<string, TreatmentPlan> = new Map();
  private safetyPlans: Map<string, SafetyPlan> = new Map();

  private constructor() {}

  static getInstance(): TherapySessionManager {
    if (!TherapySessionManager.instance) {
      TherapySessionManager.instance = new TherapySessionManager();
    }
    return TherapySessionManager.instance;
  }

  /**
   * Create new therapy session
   */
  async createSession(sessionData: Partial<TherapySession>): Promise<TherapySession> {
    try {
      // Validate required fields
      if (!sessionData.patientId || !sessionData.therapistId) {
        throw new Error('Patient ID and Therapist ID are required');
      }

      // Check HIPAA permissions
      const hasPermission = await hipaaService.requestPHIAccess({
        userId: sessionData.therapistId,
        userRole: 'therapist',
        patientId: sessionData.patientId,
        phiCategories: [PHICategory.THERAPY_NOTES, PHICategory.MENTAL_HEALTH_RECORDS],
        purpose: 'Create therapy session and clinical documentation',
        accessLevel: 'standard',
        justification: 'Clinical care - therapy session management'
      });

      if (!hasPermission) {
        throw new Error('Insufficient HIPAA permissions for session creation');
      }

      const session: TherapySession = {
        id: this.generateSessionId(),
        patientId: sessionData.patientId,
        therapistId: sessionData.therapistId,
        supervisorId: sessionData.supervisorId,
        type: sessionData.type || SessionType.INDIVIDUAL_THERAPY,
        modality: sessionData.modality || SessionModality.IN_PERSON,
        status: SessionStatus.SCHEDULED,
        scheduledStart: sessionData.scheduledStart || new Date(),
        scheduledEnd: sessionData.scheduledEnd || new Date(Date.now() + 50 * 60 * 1000), // 50 min default
        location: sessionData.location,
        platform: sessionData.platform,
        roomNumber: sessionData.roomNumber,
        clinicalFocus: sessionData.clinicalFocus || [],
        interventions: [],
        assessments: sessionData.assessments || [],
        progressNotes: [],
        treatmentPlan: sessionData.treatmentPlan,
        homework: sessionData.homework || [],
        sessionGoals: sessionData.sessionGoals || [],
        outcomeMetrics: [],
        riskAssessment: sessionData.riskAssessment || this.createDefaultRiskAssessment(),
        billingCode: sessionData.billingCode,
        insuranceAuthorization: sessionData.insuranceAuthorization,
        copayAmount: sessionData.copayAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
        encryptedFields: []
      };

      // Encrypt sensitive fields
      await this.encryptSessionData(session);

      this.sessions.set(session.id, session);

      // Audit log
      await auditLogger.logEvent(
        AuditEventType.THERAPY_SESSION_START,
        'therapy_session_created',
        {
          userId: session.therapistId,
          patientId: session.patientId,
          sessionId: session.id,
          sessionType: session.type,
          modality: session.modality,
          details: {
            scheduledDuration: session.scheduledEnd.getTime() - session.scheduledStart.getTime(),
            clinicalFocus: session.clinicalFocus
          }
        }
      );

      return session;

    } catch (error) {
      await auditLogger.logEvent(
        AuditEventType.UNAUTHORIZED_ACCESS,
        'session_creation_failed',
        {
          userId: sessionData.therapistId,
          patientId: sessionData.patientId,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          outcome: 'failure'
        }
      );
      throw error;
    }
  }

  /**
   * Start therapy session
   */
  async startSession(sessionId: string, therapistId: string): Promise<TherapySession> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (session.therapistId !== therapistId) {
      throw new Error('Unauthorized: Not the assigned therapist');
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new Error(`Cannot start session with status: ${session.status}`);
    }

    // Update session
    session.status = SessionStatus.IN_PROGRESS;
    session.actualStart = new Date();
    session.updatedAt = new Date();

    this.sessions.set(sessionId, session);

    // Audit log
    await auditLogger.logEvent(
      AuditEventType.THERAPY_SESSION_START,
      'therapy_session_started',
      {
        userId: therapistId,
        patientId: session.patientId,
        sessionId,
        details: {
          scheduledStart: session.scheduledStart,
          actualStart: session.actualStart,
          delay: session.actualStart.getTime() - session.scheduledStart.getTime()
        }
      }
    );

    return session;
  }

  /**
   * Add intervention to session
   */
  async addIntervention(
    sessionId: string,
    therapistId: string,
    intervention: Omit<Intervention, 'id'>
  ): Promise<Intervention> {
    const session = this.sessions.get(sessionId);
    if (!session || session.therapistId !== therapistId) {
      throw new Error('Session not found or unauthorized');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Can only add interventions to active sessions');
    }

    const fullIntervention: Intervention = {
      id: this.generateInterventionId(),
      ...intervention
    };

    // Encrypt sensitive intervention data
    const encryptedIntervention = {
      ...fullIntervention,
      description: await fieldEncryption.encryptField(fullIntervention.description, 'intervention_description'),
      patientResponse: await fieldEncryption.encryptField(fullIntervention.patientResponse, 'patient_response'),
      clinicianNotes: await fieldEncryption.encryptField(fullIntervention.clinicianNotes, 'clinician_notes')
    };

    session.interventions.push(encryptedIntervention);
    session.updatedAt = new Date();
    session.encryptedFields.push('interventions');

    this.sessions.set(sessionId, session);

    // Audit log
    await auditLogger.logPHIAccess(
      session.patientId,
      [PHICategory.THERAPY_NOTES],
      {
        userId: therapistId,
        sessionId,
        action: 'add_intervention',
        details: {
          interventionType: intervention.type,
          duration: intervention.duration
        }
      }
    );

    return fullIntervention;
  }

  /**
   * Create progress note
   */
  async createProgressNote(
    sessionId: string,
    therapistId: string,
    noteData: Omit<ProgressNote, 'id' | 'sessionId' | 'createdBy' | 'createdAt' | 'lastModified' | 'locked' | 'wordCount' | 'timeToComplete'>
  ): Promise<ProgressNote> {
    const session = this.sessions.get(sessionId);
    if (!session || session.therapistId !== therapistId) {
      throw new Error('Session not found or unauthorized');
    }

    const wordCount = this.countWords([
      noteData.subjective,
      noteData.objective,
      noteData.assessment,
      noteData.plan
    ].join(' '));

    const progressNote: ProgressNote = {
      id: this.generateNoteId(),
      sessionId,
      createdBy: therapistId,
      createdAt: new Date(),
      lastModified: new Date(),
      locked: false,
      wordCount,
      timeToComplete: 0, // Would be tracked in real implementation
      ...noteData
    };

    // Encrypt sensitive note content
    const encryptedNote = {
      ...progressNote,
      subjective: await fieldEncryption.encryptField(progressNote.subjective, 'soap_subjective'),
      objective: await fieldEncryption.encryptField(progressNote.objective, 'soap_objective'),
      assessment: await fieldEncryption.encryptField(progressNote.assessment, 'soap_assessment'),
      plan: await fieldEncryption.encryptField(progressNote.plan, 'soap_plan')
    };

    session.progressNotes.push(encryptedNote);
    session.updatedAt = new Date();
    
    if (!session.encryptedFields.includes('progressNotes')) {
      session.encryptedFields.push('progressNotes');
    }

    this.sessions.set(sessionId, session);

    // Audit log
    await auditLogger.logPHIAccess(
      session.patientId,
      [PHICategory.CLINICAL_NOTES, PHICategory.THERAPY_NOTES],
      {
        userId: therapistId,
        sessionId,
        action: 'create_progress_note',
        details: {
          noteType: noteData.type,
          wordCount,
          goalProgressCount: noteData.goalProgress?.length || 0
        }
      }
    );

    return progressNote;
  }

  /**
   * Complete therapy session
   */
  async completeSession(
    sessionId: string,
    therapistId: string,
    completion: {
      outcomeMetrics?: OutcomeMetric[];
      riskAssessment?: RiskAssessment;
      homework?: HomeworkAssignment[];
      nextAppointment?: Date;
    }
  ): Promise<TherapySession> {
    const session = this.sessions.get(sessionId);
    if (!session || session.therapistId !== therapistId) {
      throw new Error('Session not found or unauthorized');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new Error('Can only complete in-progress sessions');
    }

    // Validate required documentation
    if (session.progressNotes.length === 0) {
      throw new Error('Progress note required before completing session');
    }

    // Update session
    session.status = SessionStatus.COMPLETED;
    session.actualEnd = new Date();
    session.outcomeMetrics = completion.outcomeMetrics || [];
    
    if (completion.riskAssessment) {
      session.riskAssessment = completion.riskAssessment;
    }
    
    if (completion.homework) {
      session.homework = completion.homework;
    }

    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

    // Handle crisis situations
    if (this.requiresImmediateAttention(session.riskAssessment)) {
      await this.handleCrisisSituation(session);
    }

    // Calculate session statistics
    const duration = session.actualEnd.getTime() - (session.actualStart?.getTime() || session.scheduledStart.getTime());

    // Audit log
    await auditLogger.logEvent(
      AuditEventType.THERAPY_SESSION_END,
      'therapy_session_completed',
      {
        userId: therapistId,
        patientId: session.patientId,
        sessionId,
        details: {
          duration,
          interventionCount: session.interventions.length,
          progressNoteCount: session.progressNotes.length,
          homeworkAssigned: completion.homework?.length || 0,
          riskLevel: completion.riskAssessment?.suicideRisk || session.riskAssessment.suicideRisk
        }
      }
    );

    return session;
  }

  /**
   * Create treatment plan
   */
  async createTreatmentPlan(
    patientId: string,
    therapistId: string,
    planData: Omit<TreatmentPlan, 'id' | 'createdDate' | 'lastUpdated'>
  ): Promise<TreatmentPlan> {
    const treatmentPlan: TreatmentPlan = {
      id: this.generateTreatmentPlanId(),
      createdDate: new Date(),
      lastUpdated: new Date(),
      ...planData
    };

    // Encrypt sensitive plan data
    const encryptedPlan = {
      ...treatmentPlan,
      presentingProblem: await fieldEncryption.encryptField(treatmentPlan.presentingProblem, 'presenting_problem'),
      formulation: await fieldEncryption.encryptField(treatmentPlan.formulation, 'clinical_formulation')
    };

    this.treatmentPlans.set(treatmentPlan.id, encryptedPlan);

    // Audit log
    await auditLogger.logPHIAccess(
      patientId,
      [PHICategory.TREATMENT, PHICategory.CLINICAL_NOTES],
      {
        userId: therapistId,
        action: 'create_treatment_plan',
        details: {
          treatmentPlanId: treatmentPlan.id,
          goalCount: treatmentPlan.longTermGoals.length,
          objectiveCount: treatmentPlan.shortTermObjectives.length,
          estimatedDuration: treatmentPlan.estimatedDuration
        }
      }
    );

    return treatmentPlan;
  }

  /**
   * Create safety plan
   */
  async createSafetyPlan(
    patientId: string,
    therapistId: string,
    safetyPlanData: Omit<SafetyPlan, 'id' | 'createdDate' | 'lastReviewed'>
  ): Promise<SafetyPlan> {
    const safetyPlan: SafetyPlan = {
      id: this.generateSafetyPlanId(),
      createdDate: new Date(),
      lastReviewed: new Date(),
      ...safetyPlanData
    };

    this.safetyPlans.set(safetyPlan.id, safetyPlan);

    // Audit log
    await auditLogger.logEvent(
      AuditEventType.CRISIS_INTERVENTION,
      'safety_plan_created',
      {
        userId: therapistId,
        patientId,
        details: {
          safetyPlanId: safetyPlan.id,
          contactCount: safetyPlan.socialContacts.length + safetyPlan.professionalContacts.length,
          copingStrategiesCount: safetyPlan.copingStrategies.length
        }
      }
    );

    return safetyPlan;
  }

  /**
   * Get session history for patient
   */
  async getPatientSessions(
    patientId: string,
    therapistId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      status?: SessionStatus;
      type?: SessionType;
      limit?: number;
    }
  ): Promise<TherapySession[]> {
    // Verify therapist has access to patient
    const hasAccess = await this.verifyTherapistAccess(therapistId, patientId);
    if (!hasAccess) {
      throw new Error('Unauthorized access to patient sessions');
    }

    let sessions = Array.from(this.sessions.values())
      .filter(session => session.patientId === patientId);

    // Apply filters
    if (filters?.startDate) {
      sessions = sessions.filter(s => s.scheduledStart >= filters.startDate!);
    }
    
    if (filters?.endDate) {
      sessions = sessions.filter(s => s.scheduledStart <= filters.endDate!);
    }
    
    if (filters?.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }
    
    if (filters?.type) {
      sessions = sessions.filter(s => s.type === filters.type);
    }

    // Sort by most recent first
    sessions.sort((a, b) => b.scheduledStart.getTime() - a.scheduledStart.getTime());

    // Apply limit
    if (filters?.limit) {
      sessions = sessions.slice(0, filters.limit);
    }

    // Audit log
    await auditLogger.logPHIAccess(
      patientId,
      [PHICategory.THERAPY_NOTES],
      {
        userId: therapistId,
        action: 'view_session_history',
        details: {
          sessionCount: sessions.length,
          filters
        }
      }
    );

    return sessions;
  }

  // Private helper methods

  private async encryptSessionData(session: TherapySession): Promise<void> {
    // Mark fields that will be encrypted
    const fieldsToEncrypt = ['clinicalFocus'];
    
    for (const field of fieldsToEncrypt) {
      if (session[field as keyof TherapySession]) {
        session.encryptedFields.push(field);
      }
    }
  }

  private createDefaultRiskAssessment(): RiskAssessment {
    return {
      suicideRisk: RiskLevel.NONE,
      selfHarmRisk: RiskLevel.NONE,
      homicideRisk: RiskLevel.NONE,
      substanceUseRisk: RiskLevel.NONE,
      riskFactors: [],
      protectiveFactors: [],
      immediateAction: 'Continue monitoring'
    };
  }

  private requiresImmediateAttention(riskAssessment: RiskAssessment): boolean {
    return [
      riskAssessment.suicideRisk,
      riskAssessment.selfHarmRisk,
      riskAssessment.homicideRisk
    ].some(risk => risk === RiskLevel.HIGH || risk === RiskLevel.IMMINENT);
  }

  private async handleCrisisSituation(session: TherapySession): Promise<void> {
    await auditLogger.logCrisisIntervention(
      session.patientId,
      'crisis_identified_in_session',
      {
        sessionId: session.id,
        therapistId: session.therapistId,
        details: {
          suicideRisk: session.riskAssessment.suicideRisk,
          selfHarmRisk: session.riskAssessment.selfHarmRisk,
          riskFactors: session.riskAssessment.riskFactors,
          immediateAction: session.riskAssessment.immediateAction
        }
      }
    );

    // In production, this would:
    // - Notify crisis team
    // - Update safety plan
    // - Schedule immediate follow-up
    // - Contact emergency services if needed
  }

  private async verifyTherapistAccess(therapistId: string, patientId: string): Promise<boolean> {
    // In production, verify therapist-patient relationship
    // For now, simplified check
    return true;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${random}`;
  }

  private generateInterventionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `intervention_${timestamp}_${random}`;
  }

  private generateNoteId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `note_${timestamp}_${random}`;
  }

  private generateTreatmentPlanId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `plan_${timestamp}_${random}`;
  }

  private generateSafetyPlanId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `safety_${timestamp}_${random}`;
  }
}

// Export singleton instance
export const therapySessionManager = TherapySessionManager.getInstance();