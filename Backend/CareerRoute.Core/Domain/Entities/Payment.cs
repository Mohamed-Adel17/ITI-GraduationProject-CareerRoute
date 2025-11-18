using CareerRoute.Core.Domain.Enums;
namespace CareerRoute.Core.Domain.Entities
{
    public class Payment
    {

        public string Id { get; set; } = string.Empty;               
       
        // ---------- Payment Provider ----------
        public PaymentProviderOptions PaymentProvider { get; set; }
        public PaymobPaymentMethodOptions? PaymobPaymentMethod { get; set; }
        public string PaymentIntentId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;

        // ---------- Financial Information ----------
        public decimal Amount { get; set; }                   // Total session price
        public decimal PlatformCommission { get; set; } = 0.15m;       // 15%
        public decimal MentorPayoutAmount => Amount * (1 - PlatformCommission);

        public string Currency { get; set; } = "USD";
        public DateTime? PaidAt { get; set; }


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

        public string ProviderTransactionId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        // -------- Relations --------
        public string SessionId { get; set; } = null!;
        public virtual Session Session { get; set; } = null!;

        public string MenteeId { get; set; } = null!;
        public virtual ApplicationUser Mentee { get; set; } = null!;

    }
}
