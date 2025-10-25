using System.Diagnostics;

namespace CareerRoute.API.Middleware
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate next;
        private readonly ILogger<RequestLoggingMiddleware> logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            this.next = next;
            this.logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            var stopwatch = Stopwatch.StartNew();
            //logic before: 
            //logging information on console for reqestmethod + path 
            logger.LogInformation("Incoming request: {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);


            try
            {
                //next middleware calling 
                await next(httpContext);
            }
            finally
            {
                //logic after:
                stopwatch.Stop();
                logger.LogInformation("Outgoing response {StatusCode} for {Method} {Path} Took {ElapsedMilliseconds} ms",
                    httpContext.Response.StatusCode,
                    httpContext.Request.Method,
                    httpContext.Request.Path,
                    stopwatch.ElapsedMilliseconds);
            }

        }
    }
}

