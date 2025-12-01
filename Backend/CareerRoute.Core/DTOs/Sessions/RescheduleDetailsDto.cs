namespace CareerRoute.Core.DTOs.Sessions;

public class RescheduleDetailsDto
{
    public string RescheduleId { get; set; } = null!;
    public string SessionId { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string MentorName { get; set; } = null!;
    public string MenteeName { get; set; } = null!;
    public string? Topic { get; set; }
    public DateTime OriginalStartTime { get; set; }
    public DateTime NewStartTime { get; set; }
    public string RequestedBy { get; set; } = null!;
    public string RescheduleReason { get; set; } = null!;
    public DateTime RequestedAt { get; set; }
}
