namespace CareerRoute.Core.Exceptions
{
    public class PaymentException : Exception
    {
        public string? PaymentProvider { get; }
        public string? PaymentIntentId { get; }

        public PaymentException(string message) : base(message) { }

        public PaymentException(string message, Exception innerException)
            : base(message, innerException) { }

        public PaymentException(string message, string paymentProvider)
            : base(message)
        {
            PaymentProvider = paymentProvider;
        }

        public PaymentException(string message, string paymentProvider, Exception innerException)
            : base(message, innerException)
        {
            PaymentProvider = paymentProvider;
        }

        public PaymentException(string message, string paymentProvider, string paymentIntentId)
            : base(message)
        {
            PaymentProvider = paymentProvider;
            PaymentIntentId = paymentIntentId;
        }
    }
}
