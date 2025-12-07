/**
 * Dispute Models
 *
 * TypeScript interfaces and enums for session dispute management.
 * Based on: Dispute-Endpoints.md
 */

// ===========================
// Enums
// ===========================

/** Reason for dispute */
export enum DisputeReason {
  MentorNoShow = 'MentorNoShow',
  TechnicalIssues = 'TechnicalIssues',
  SessionQuality = 'SessionQuality',
  Other = 'Other'
}

/** Dispute status */
export enum DisputeStatus {
  Pending = 'Pending',
  Resolved = 'Resolved',
  Rejected = 'Rejected'
}

/** Resolution type for dispute */
export enum DisputeResolution {
  FullRefund = 'FullRefund',
  PartialRefund = 'PartialRefund',
  NoRefund = 'NoRefund'
}

// ===========================
// Interfaces
// ===========================

/** Basic dispute DTO (for mentee/mentor view) */
export interface DisputeDto {
  id: string;
  sessionId: string;
  menteeId: string;
  reason: DisputeReason;
  description?: string | null;
  status: DisputeStatus;
  resolution?: DisputeResolution | null;
  refundAmount?: number | null;
  adminNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

/** Admin dispute DTO with full details */
export interface AdminDisputeDto {
  id: string;
  sessionId: string;
  menteeId: string;
  menteeFirstName: string;
  menteeLastName: string;
  menteeEmail: string;
  mentorId: string;
  mentorFirstName: string;
  mentorLastName: string;
  sessionPrice: number;
  reason: DisputeReason;
  description?: string | null;
  status: DisputeStatus;
  resolution?: DisputeResolution | null;
  refundAmount?: number | null;
  adminNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

/** Create dispute request */
export interface CreateDisputeDto {
  reason: DisputeReason;
  description?: string;
}

/** Resolve dispute request (Admin) */
export interface ResolveDisputeDto {
  resolution: DisputeResolution;
  refundAmount?: number;
  adminNotes?: string;
}

/** Admin dispute filter */
export interface AdminDisputeFilterDto {
  status?: DisputeStatus | '';
  reason?: DisputeReason | '';
  menteeId?: string;
  mentorId?: string;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: 'status' | 'reason' | 'createdAt';
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

/** Pagination metadata */
export interface DisputePaginationMetadata {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Admin dispute list response */
export interface AdminDisputeListResponse {
  disputes: AdminDisputeDto[];
  pagination: DisputePaginationMetadata;
}

// ===========================
// Helper Functions
// ===========================

/** Get display text for dispute reason */
export function getDisputeReasonText(reason: DisputeReason): string {
  const map: Record<DisputeReason, string> = {
    [DisputeReason.MentorNoShow]: 'Mentor No Show',
    [DisputeReason.TechnicalIssues]: 'Technical Issues',
    [DisputeReason.SessionQuality]: 'Session Quality',
    [DisputeReason.Other]: 'Other'
  };
  return map[reason] || reason;
}

/** Get display text for dispute status */
export function getDisputeStatusText(status: DisputeStatus): string {
  return status;
}

/** Get CSS class for dispute status badge */
export function getDisputeStatusColor(status: DisputeStatus): string {
  const map: Record<DisputeStatus, string> = {
    [DisputeStatus.Pending]: 'bg-warning text-dark',
    [DisputeStatus.Resolved]: 'bg-success text-white',
    [DisputeStatus.Rejected]: 'bg-danger text-white'
  };
  return map[status] || 'bg-secondary';
}

/** Get display text for resolution type */
export function getResolutionText(resolution: DisputeResolution): string {
  const map: Record<DisputeResolution, string> = {
    [DisputeResolution.FullRefund]: 'Full Refund',
    [DisputeResolution.PartialRefund]: 'Partial Refund',
    [DisputeResolution.NoRefund]: 'No Refund'
  };
  return map[resolution] || resolution;
}

/** Check if dispute can be resolved */
export function canResolveDispute(status: DisputeStatus): boolean {
  return status === DisputeStatus.Pending;
}
