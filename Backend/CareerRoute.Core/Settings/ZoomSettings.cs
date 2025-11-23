using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Settings
{
    public class ZoomSettings
    {
        public string AccountId { get; set; } = string.Empty;
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string WebhookSecretToken { get; set; } = string.Empty;
        public string ApiBaseUrl { get; set; } = "https://api.zoom.us/v2/";
        public string OAuthTokenUrl { get; set; } = "https://zoom.us/oauth/token";
        public int TokenExpirationMinutes { get; set; } = 55;
        public int MaxRetryAttempts { get; set; } = 3;
        public int RetryDelayMilliseconds { get; set; } = 1000;
        public int MeetingTerminationIntervalMinutes { get; set; } = 10;
    }
}
