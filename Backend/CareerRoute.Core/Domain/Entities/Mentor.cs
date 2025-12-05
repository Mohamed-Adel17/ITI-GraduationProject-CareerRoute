using CareerRoute.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace CareerRoute.Core.Domain.Entities
{
    public class Mentor
    {
        //Primary Key
        [Key]
        [ForeignKey(nameof(User))]
        public string Id { get; set; } = string.Empty;
        //================================================
        //Navigation Property
        public virtual ApplicationUser User { get; set; } = null!;
        //================================================
        //Profile Information
        [MaxLength(2000)]
        public string? Bio { get; set; }
        [MaxLength(500)]
        public string? ExpertiseTags { get; set; }
        public int? YearsOfExperience { get; set; }
        [MaxLength(1000)]
        public string? Certifications { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Rate30Min { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal Rate60Min { get; set; }
        [Column(TypeName = "decimal(3,2)")]
        public decimal AverageRating { get; set; } = 0;
        public int TotalReviews { get; set; } = 0;
        public int TotalSessionsCompleted { get; set; } = 0;
        //================================================
        //Approval Status
        public bool IsVerified { get; set; } = false;
        public MentorApprovalStatus ApprovalStatus { get; set; } = MentorApprovalStatus.Pending;
        //================================================
        //Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        //================================================
        public bool IsAvailable { get; set; } = true;
        //================================================
        //CV Storage
        [MaxLength(500)]
        public string? CvStorageKey { get; set; }
        [MaxLength(2000)]
        public string? CvUrl { get; set; }
        public DateTime? CvUrlExpiry { get; set; }
        //================================================
        //TO-DO: Navigation Property
        //public virtual ICollection<Session> Sessions { get; set; }
        //public virtual ICollection<ReviewSession> Reviews { get; set; }
        public virtual ICollection<MentorCategory> MentorCategories { get; set; } = new List<MentorCategory>();
        public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
        
        // Balance and Payout navigation properties
        public virtual MentorBalance? Balance { get; set; }
        public virtual ICollection<Payout> Payouts { get; set; } = new List<Payout>();
    }
}
