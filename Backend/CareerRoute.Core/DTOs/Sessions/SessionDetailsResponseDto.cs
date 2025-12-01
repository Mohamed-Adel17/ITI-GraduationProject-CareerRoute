public class SessionDetailsResponseDto
{

    public string Id { get; set; } = null!;

    public string MenteeId { get; set; } = null!;
    public string MenteeFirstName { get; set; } = null!;
    public string MenteeLastName { get; set; } = null!;
    public string? MenteeProfilePictureUrl { get; set; }

    public string MentorId { get; set; } = null!;
    public string MentorFirstName { get; set; } = null!;
    public string MentorLastName { get; set; } = null!;
    public string? MentorProfilePictureUrl { get; set; }

    public string SessionType { get; set; } = null!;
    public string Duration { get; set; } = null!;

    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string Status { get; set; } = null!;

    public string VideoConferenceLink { get; set; } = null!;
    public string? Topic { get; set; }
    public string? Notes { get; set; }

    public decimal Price { get; set; }

    public string PaymentId { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;

    public string? CancellationReason { get; set; }

    public string? RescheduleId { get; set; }  // Only populated when status is PendingReschedule
    public string? RescheduleRequestedBy { get; set; }  // "Mentor" or "Mentee" - only when PendingReschedule

    public bool CanReschedule { get; set; }
    public bool CanCancel { get; set; }
    public int HoursUntilSession { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}



