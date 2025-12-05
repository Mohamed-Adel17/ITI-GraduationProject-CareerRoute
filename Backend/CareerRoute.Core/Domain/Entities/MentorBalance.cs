using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerRoute.Core.Domain.Entities
{
    /// <summary>
    /// Tracks the financial state of a mentor's earnings including available balance, 
    /// pending balance, and total earnings from completed sessions.
    /// </summary>
    public class MentorBalance
    {
        /// <summary>
        /// Primary key and foreign key to Mentor entity (one-to-one relationship)
        /// </summary>
        [Key]
        [ForeignKey(nameof(Mentor))]
        public string MentorId { get; set; } = string.Empty;

        /// <summary>
        /// Amount available for immediate payout withdrawal
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal AvailableBalance { get; set; } = 0;

        /// <summary>
        /// Amount from recently completed sessions held during the holding period
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PendingBalance { get; set; } = 0;

        /// <summary>
        /// Cumulative sum of all earnings from completed sessions
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalEarnings { get; set; } = 0;

        /// <summary>
        /// Timestamp when the balance record was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when the balance was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public virtual Mentor Mentor { get; set; } = null!;
    }
}
