using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class CompleteSessionResponseDto
    {
        public string Id { get; set; } = null!;
        public string Status { get; set; } = null!;
        public DateTime CompletedAt { get; set; }
        public string Duration { get; set; } = null!;
        public int ActualDurationMinutes { get; set; }
        public DateTime PaymentReleaseDate { get; set; }

    }
}

  
