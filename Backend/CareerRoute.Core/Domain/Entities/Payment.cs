using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public class Payment
    {

        public string Id { get; set; }               
       
        // ---------- Payment Provider ----------
        public PaymentMethodOptions PaymentMethod { get; set; }
        public string PaymentIntentId { get; set; }
        public string ClientSecret { get; set; }

        // ---------- Financial Information ----------
        public decimal Amount { get; set; }                   // Total session price
        public decimal PlatformCommission { get; set; } = 0.15m;       // 15%
        public decimal MentorPayoutAmount => Amount * (1 - PlatformCommission);

        public string Currency { get; set; } = "USD";

        // ---------- Payment Status ----------
        public PaymentStatusOptions Status { get; set; }

        // ---------- Refund Information ----------
        public bool IsRefunded { get; set; }
        public decimal? RefundAmount { get; set; }
        public decimal? RefundPercentage { get; set; }
        public RefundStatus? RefundStatus { get; set; }
        public DateTime? RefundedAt { get; set; }

        // ---------- Payout (Mentor Earnings Release) ----------
        public DateTime? PaymentReleaseDate { get; set; }
        public bool IsReleasedToMentor { get; set; }
        public DateTime? ReleasedAt { get; set; }

        public string ProviderTransactionId { get; set; }
        public string ProviderSignature { get; set; }


        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public string SessionId { get; set; }
        public Session Session { get; set; }
    }


}
