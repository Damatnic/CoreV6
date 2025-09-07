// Crisis intervention and management types
import { CrisisStatus } from './enums';

export interface CounselorDashboardResponse {
  stats: CounselorStats;
  alerts: AlertResponse[];
  reports: ReportResponse[];
  interventions: InterventionResponse[];
  escalations: EscalationResponse[];
}

export interface CounselorStats {
  activeAlerts: number;
  resolvedToday: number;
  averageResponseTime: number;
  totalInterventions: number;
  successRate: number;
}

export interface AlertResponse {
  id: string;
  type: string;
  severity: CrisisSeverity;
  userId: string;
  context: string;
  indicators: string[];
  handled: boolean;
  actions: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportResponse {
  id: string;
  userId: string | null;
  severityLevel: number;
  triggerType: string;
  interventionType: string;
  responseTime: number;
  resolved: boolean;
  resolvedAt: Date | null;
  emergencyContactUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterventionResponse {
  id: string;
  reportId: string;
  counselorId: string;
  type: InterventionType;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  notes?: string;
  outcome?: string;
}

export interface EscalationResponse {
  id: string;
  reportId: string;
  fromLevel: string;
  toLevel: string;
  reason: string;
  escalatedBy: string;
  escalatedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface CreateReportRequest {
  userId?: string;
  severityLevel: number;
  triggerType: TriggerType;
  interventionType: InterventionType;
  details: string;
  isAnonymous?: boolean;
  emergencyContacts?: string[];
}

export interface UpdateReportRequest {
  status?: ReportStatus;
  reviewNotes?: string;
  actionTaken?: string;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface ReportFilters {
  status?: ReportStatus;
  severityLevel?: number;
  triggerType?: TriggerType;
  interventionType?: InterventionType;
  startDate?: string;
  endDate?: string;
  counselorId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Enums
export enum CrisisSeverity {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  CRITICAL = "critical",
  IMMINENT = "imminent"
}

export enum TriggerType {
  SELF_HARM = "self_harm",
  SUICIDAL_IDEATION = "suicidal_ideation",
  SUBSTANCE_ABUSE = "substance_abuse",
  DOMESTIC_VIOLENCE = "domestic_violence",
  PANIC_ATTACK = "panic_attack",
  PSYCHOTIC_EPISODE = "psychotic_episode",
  OTHER = "other"
}

export enum InterventionType {
  IMMEDIATE_RESPONSE = "immediate_response",
  SAFETY_PLANNING = "safety_planning",
  EMERGENCY_CONTACT = "emergency_contact",
  PROFESSIONAL_REFERRAL = "professional_referral",
  FOLLOW_UP = "follow_up",
  ESCALATION = "escalation"
}

export enum ReportStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  ESCALATED = "escalated",
  CLOSED = "closed"
}


// Crisis alert types
export interface CrisisAlert {
  id: string;
  type: string;
  severity: CrisisSeverity;
  status: CrisisStatus;
  userId: string;
  assignedCounselors: string[];
  context: string;
  indicators: string[];
  handled: boolean;
  actions: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrisisAlertPayload {
  type: string;
  severity: CrisisSeverity;
  userId: string;
  context: string;
  indicators: string[];
  location?: string;
  contactMethod?: string;
}