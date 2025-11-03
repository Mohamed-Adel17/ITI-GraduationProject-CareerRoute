namespace CareerRoute.API.Models
{
    /// <summary>
    /// Base API response class for consistent response format across all endpoints
    /// Use this for error responses or responses without typed data
    /// </summary>
    public class ApiResponse
    {
        /// <summary>
        /// Indicates whether the request was successful
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// The response data payload
        /// </summary>
        public object? Data { get; set; }

        /// <summary>
        /// Optional message providing additional context
        /// </summary>
        public string? Message { get; set; }

        /// <summary>
        /// HTTP status code (included in error responses for frontend)
        /// </summary>
        public int? StatusCode { get; set; }

        /// <summary>
        /// Validation errors dictionary (field name -> error messages)
        /// </summary>
        public IDictionary<string, string[]>? Errors { get; set; }

        public ApiResponse()
        {
        }

        /// <summary>
        /// Creates an error response with message and status code
        /// </summary>
        /// <param name="message">Error message</param>
        /// <param name="statusCode">HTTP status code</param>
        /// <param name="errors">Optional validation errors dictionary</param>
        /// <returns>ApiResponse with Success=false</returns>
        public static ApiResponse Error(string message, int statusCode, IDictionary<string, string[]>? errors = null)
        {
            return new ApiResponse
            {
                Success = false,
                Message = message,
                StatusCode = statusCode,
                Errors = errors
            };
        }
    }

    /// <summary>
    /// Generic API response wrapper for success responses with typed data
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class ApiResponse<T> : ApiResponse
    {
        /// <summary>
        /// The strongly-typed response data payload
        /// </summary>
        public new T? Data { get; set; }

        public ApiResponse()
        {
        }

        public ApiResponse(T data, string? message = null)
        {
            Success = true;
            Data = data;
            Message = message;
        }
    }
}
