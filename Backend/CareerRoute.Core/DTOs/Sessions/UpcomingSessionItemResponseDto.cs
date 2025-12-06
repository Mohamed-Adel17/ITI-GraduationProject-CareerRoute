
namespace CareerRoute.Core.DTOs.Sessions
{
    public class UpcomingSessionItemResponseDto
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
        public string? MentorHeadline { get; set; }

        public string SessionType { get; set; } = null!;
        public string Duration { get; set; } = null!;

        public DateTime ScheduledStartTime { get; set; }
        public string Status { get; set; } = null!;
        public decimal Price { get; set; }
        public DateTime CreatedAt { get; set; }

        public string VideoConferenceLink { get; set; } = null!;
        public string? Topic { get; set; }

        public int HoursUntilSession { get; set; }


    }
}
