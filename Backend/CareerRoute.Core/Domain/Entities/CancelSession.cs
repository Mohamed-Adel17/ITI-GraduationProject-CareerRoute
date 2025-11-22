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
        public string Id { get; set; }   
        public string CancelationReason { get; set; } 
        public string CancelledBy { get; set; }
        public DateTime CancelledAt { get; set; } = DateTime.UtcNow;
        public SessionStatusOptions Status { get; set; }
        public string SessionId { get; set; }
        public Session Session { get; set; } 

        // Refund details
        public decimal RefundAmount { get; set; } 
        public int RefundPercentage { get; set; } 
        public RefundStatus RefundStatus { get; set; }

    }
}




