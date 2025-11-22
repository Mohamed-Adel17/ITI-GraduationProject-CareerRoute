using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class PastSessionItemResponseDto
    {
        
            public string Id { get; set; }

            public string MenteeId { get; set; }
            public string MenteeFirstName { get; set; }
            public string MenteeLastName { get; set; }

            public string MentorId { get; set; }
            public string MentorFirstName { get; set; }
            public string MentorLastName { get; set; }
            public string? MentorProfilePictureUrl { get; set; }

            public string SessionType { get; set; }
            public string Duration { get; set; }

            public DateTime ScheduledStartTime { get; set; }
            public DateTime ScheduledEndTime { get; set; }

            public string Status { get; set; }
            public string Topic { get; set; }

            public bool HasReview { get; set; }
            public DateTime? CompletedAt { get; set; }
        

    }
}
