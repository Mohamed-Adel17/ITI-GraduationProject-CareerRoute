using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class CompleteSessionResponseDto
    {
        public string Id { get; set; }
        public string Status { get; set; }
        public DateTime CompletedAt { get; set; }
        public string Duration { get; set; }
        public int ActualDurationMinutes { get; set; }
        public DateTime PaymentReleaseDate { get; set; }

    }
}
