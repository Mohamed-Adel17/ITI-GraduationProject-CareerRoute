using System.Text.Json.Serialization;

namespace CareerRoute.API.Models
{
    public class ErrorResponse
    {
        [JsonPropertyName("statusCode")]
        public int StatusCode { get; set; }

        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;

        [JsonPropertyName("details")]
        public string? Details { get; set; }

        [JsonPropertyName("path")]
        public string? Path { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("errors")]
        public IDictionary<string, string[]>? Errors { get; set; }
        public ErrorResponse()
        {
            Timestamp = DateTime.UtcNow;  
        }

        public ErrorResponse(int statusCode, string message)
        {
            StatusCode = statusCode;
            Message = message;
            Timestamp = DateTime.UtcNow; 
        }
    }
}
