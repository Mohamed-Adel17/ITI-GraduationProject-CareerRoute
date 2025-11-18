public class SessionDetailsResponseDto
{
    public string Id { get; set; }
    public string MenteeId { get; set; }
    public string MenteeFirstName { get; set; }
    public string MenteeLastName { get; set; }
    public string? MenteeProfilePictureUrl { get; set; }

    public string MentorId { get; set; }
    public string MentorFirstName { get; set; }
    public string MentorLastName { get; set; }
    public string? MentorProfilePictureUrl { get; set; }

    public string SessionType { get; set; }
    public string Duration { get; set; }

    public DateTime ScheduledStartTime { get; set; }
    public DateTime ScheduledEndTime { get; set; }
    public string Status { get; set; }

    public string VideoConferenceLink { get; set; }
    public string? Topic { get; set; }
    public string? Notes { get; set; }

    public decimal Price { get; set; }

    public string PaymentId { get; set; }
    public string PaymentStatus { get; set; }

    //public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool CanReschedule { get; set; }
    public bool CanCancel { get; set; }
    public double HoursUntilSession { get; set; }
  
}
