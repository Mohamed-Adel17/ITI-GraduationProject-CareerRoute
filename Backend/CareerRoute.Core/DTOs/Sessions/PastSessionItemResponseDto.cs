using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class PastSessionItemResponseDto
    {
        
            public string Id { get; set; } = null!;

            public string MenteeId { get; set; } = null!;
            public string MenteeFirstName { get; set; } = null!;
            public string MenteeLastName { get; set; } = null!;

            public string MentorId { get; set; } = null!;
            public string MentorFirstName { get; set; } = null!;
            public string MentorLastName { get; set; } = null!;
            public string? MentorProfilePictureUrl { get; set; }

            public string SessionType { get; set; } = null!;
            public string Duration { get; set; } = null!;

            public DateTime ScheduledStartTime { get; set; }
            public DateTime ScheduledEndTime { get; set; }

            public string Status { get; set; } = null!;
            public string Topic { get; set; } = null!;

            public bool HasReview { get; set; }
            public DateTime? CompletedAt { get; set; }
        

    }
}
