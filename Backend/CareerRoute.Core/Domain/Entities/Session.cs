using CareerRoute.Core.Domain.Enums;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerRoute.Core.Domain.Entities
{
    public class Session
    {
        public string Id { get; set; }
        
        [MaxLength(450), Required]
        public required string MenteeId { get; set; }
        
        [MaxLength(450), Required]
        public required string MentorId { get; set; }

        public string? TimeSlotId { get; set; }
        
        public string? PaymentId { get; set; }
        
        public SessionTypeOptions SessionType { get; set; }
        
        public DurationOptions Duration { get; set; }
        
        public DateTime ScheduledStartTime { get; set; }
        
        public DateTime ScheduledEndTime { get; set; }
        
        public SessionStatusOptions Status { get; set; }
        
        [MaxLength(500)]
        public string? VideoConferenceLink { get; set; }
        
        [MaxLength(200)]
        public string? Topic { get; set; }
        
        [MaxLength(1000)]
        public string? Notes { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }
        
        [MaxLength(500)]
        public string? CancellationReason { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        // Zoom integration fields
        public long? ZoomMeetingId { get; set; }
        
        [MaxLength(100)]
        public string? ZoomMeetingPassword { get; set; }
        
        [MaxLength(500)]
        public string? RecordingPlayUrl { get; set; }
        
        public string? Transcript { get; set; }
        
        public DateTime? RecordingAvailableAt { get; set; }
        
        public bool RecordingProcessed { get; set; } = false;
        
        public bool TranscriptProcessed { get; set; } = false;
        
        public int TranscriptRetrievalAttempts { get; set; } = 0;
        
        public DateTime? LastTranscriptRetrievalAttempt { get; set; }
        
        [MaxLength(500)]
        public string? VideoStorageKey { get; set; }

        public string? Summary { get; set; }
        
        [MaxLength(100)]
        public string? ReminderJobId { get; set; }

        public string? ReviewRequestJobId { get; set; }

        // AI Preparation for Mentor
        public string? AIPreparationGuide { get; set; }
        public DateTime? AIPreparationGeneratedAt { get; set; }
        // Navigation properties
        public virtual ApplicationUser Mentee { get; set; } = null!;
        public virtual Mentor Mentor { get; set; } = null!;
        public virtual TimeSlot? TimeSlot { get; set; }
        public Payment? Payment { get; set; }
        public ReviewSession? Review { get; set; }
      

        public RescheduleSession? Reschedule { get; set; }
        public CancelSession? Cancellation { get; set; }

    }
}
