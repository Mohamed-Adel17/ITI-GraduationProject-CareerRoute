using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Sessions
{
    public class CancelSessionResponseDto
    {
        public string Id { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string CancellationReason { get; set; } = null!;
        public string CancelledBy { get; set; } = null!;
        public DateTime CancelledAt { get; set; }
        public decimal RefundAmount { get; set; }
        public int RefundPercentage { get; set; }
        public string RefundStatus { get; set; } = null!;
    }
}
