using CareerRoute.Core.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerRoute.Core.Domain.Entities
{
    /// <summary>
    /// Represents a withdrawal request from a mentor to transfer their available balance
    /// to their external account.
    /// </summary>
    public class Payout
    {
        /// <summary>
        /// Unique identifier for the payout request
        /// </summary>
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        /// <summary>
        /// Foreign key to the Mentor entity
        /// </summary>
        [Required]
        [MaxLength(450)]
        public string MentorId { get; set; } = string.Empty;

        /// <summary>
        /// Amount requested for payout
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Current status of the payout request
        /// </summary>
        public PayoutStatus Status { get; set; } = PayoutStatus.Pending;

        /// <summary>
        /// Reason for failure if the payout failed
        /// </summary>
        [MaxLength(500)]
        public string? FailureReason { get; set; }

        /// <summary>
        /// Timestamp when the payout was requested
        /// </summary>
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when the payout processing started
        /// </summary>
        public DateTime? ProcessedAt { get; set; }

        /// <summary>
        /// Timestamp when the payout was successfully completed
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Timestamp when the payout was cancelled
        /// </summary>
        public DateTime? CancelledAt { get; set; }

        // Navigation property
        public virtual Mentor Mentor { get; set; } = null!;
    }
}
