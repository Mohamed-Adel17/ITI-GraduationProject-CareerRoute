using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public  class CancelSession
    {
        public string Id { get; set; } = null!;
        public string CancellationReason { get; set; } = string.Empty;
        public string CancelledBy { get; set; } = string.Empty;
        public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
        public SessionStatusOptions Status { get; set; }
        public string SessionId { get; set; } = null!;
        public virtual Session Session { get; set; } 

        // Refund details
        public decimal RefundAmount { get; set; } 
        public int RefundPercentage { get; set; } 
        public RefundStatus RefundStatus { get; set; }

    }
}




