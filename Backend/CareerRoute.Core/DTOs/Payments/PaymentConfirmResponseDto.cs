using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Sessions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentConfirmResponseDto
    {
        public Guid PaymentId { get; set; }
        public Guid SessionId { get; set; }
        public decimal Amount { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal MentorPayoutAmount { get; set; }
        public PaymentMethodOptions PaymentMethod { get; set; }
        public string Status { get; set; }
        public string TransactionId { get; set; }
        public DateTime PaidAt { get; set; }
        //public SessionDto Session { get; set; }
    }
}
