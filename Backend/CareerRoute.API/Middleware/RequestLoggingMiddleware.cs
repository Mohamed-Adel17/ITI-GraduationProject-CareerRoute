namespace CareerRoute.API.Middleware
{
    public class RequestLoggingMiddleware
    {
        RequestDelegate next; 
        ILogger<RequestLoggingMiddleware> logger;

        public RequestLoggingMiddleware(RequestDelegate next ,ILogger<RequestLoggingMiddleware> logger)
        {
            this.next = next;
            this.logger = logger; 
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            //logic before: 
                           //logging information on console for reqestmethod + path 
            logger.LogInformation("Incoming request: {Method} {Path}", httpContext.Request.Method , httpContext.Request.Path);

            //next middleware calling 
            await next(httpContext);

        }
    }
}
