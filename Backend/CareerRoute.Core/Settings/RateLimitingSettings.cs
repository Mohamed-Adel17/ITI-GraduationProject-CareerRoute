namespace CareerRoute.Core.Settings
{
    public class RateLimitingSettings
    {
        public int GlobalLimit { get; set; } = 100;
        public int AuthLimit { get; set; } = 5;
        public int PasswordResetLimit { get; set; } = 3;
        public int ForgetPasswordLimit { get; set; } = 3;
        public int PaymentLimit { get; set; } = 10;
        public int WindowInMinutes { get; set; } = 1;
    }
}
