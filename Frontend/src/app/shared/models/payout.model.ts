import { PaginationMetadata } from './payment.model';

/**
 * Payout status enum (string values match backend contract)
 */
export enum PayoutStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
  Cancelled = 'Cancelled'
}

/**
 * Payout entity
 */
export interface Payout {
  id: string;
  mentorId: string;
  mentorFirstName?: string;
  mentorLastName?: string;
  mentorEmail?: string;
  amount: number;
  status: PayoutStatus;
  failureReason?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

/** Request payout payload */
export interface RequestPayoutDto {
  amount: number;
}

/** Mentor payout history response */
export interface MentorPayoutHistoryResponse {
  payouts: Payout[];
  pagination: PaginationMetadata;
}

/** Admin payout list response */
export interface AdminPayoutListResponse {
  payouts: Payout[];
  pagination: PaginationMetadata;
}

/** Admin payout filter DTO */
export interface AdminPayoutFilterDto {
  mentorId?: string;
  mentorName?: string;
  mentorEmail?: string;
  status?: PayoutStatus | '';
  minAmount?: number | null;
  maxAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  sortBy?: 'amount' | 'status' | 'mentor' | 'requestedAt';
  sortDescending?: boolean;
  page?: number;
  pageSize?: number;
}

/** Helpers */
export function getPayoutStatusText(status: PayoutStatus): string {
  return status;
}

export function getPayoutStatusColor(status: PayoutStatus): string {
  const colorMap: Record<PayoutStatus, string> = {
    [PayoutStatus.Pending]: 'warning',
    [PayoutStatus.Processing]: 'primary',
    [PayoutStatus.Completed]: 'success',
    [PayoutStatus.Failed]: 'danger',
    [PayoutStatus.Cancelled]: 'gray'
  };

  return colorMap[status] || 'gray';
}

export function isPayoutProcessable(status: PayoutStatus): boolean {
  return status === PayoutStatus.Pending;
}

export function isPayoutCancellable(status: PayoutStatus): boolean {
  return status === PayoutStatus.Pending || status === PayoutStatus.Processing;
}
