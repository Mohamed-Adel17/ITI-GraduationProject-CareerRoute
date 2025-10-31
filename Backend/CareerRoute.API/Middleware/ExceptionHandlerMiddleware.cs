using CareerRoute.API.Models;
using CareerRoute.Core.Exceptions;
using System.Net;
using System.Text.Json;


namespace CareerRoute.API.Middleware
{
    public class ExceptionHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlerMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionHandlerMiddleware
            (RequestDelegate next, 
            ILogger<ExceptionHandlerMiddleware> logger,
            IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }
      
        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            var response = new ErrorResponse() { Path = context.Request.Path};
            switch (exception)
            {
                case NotFoundException notFoundEx:
                    response.StatusCode = (int)HttpStatusCode.NotFound;
                    response.Message = notFoundEx.Message;
                    _logger.LogWarning(notFoundEx, $"Resource not found: {notFoundEx.Message}");
                    break;
                case BusinessException businessEx:
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = businessEx.Message;
                    _logger.LogWarning(businessEx, $"Business rule violation: {businessEx.Message}");
                    break;
                case ValidationException validationEx:
                    response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response.Message = validationEx.Message;
                    response.Errors = validationEx.Errors;
                    _logger.LogWarning(validationEx, $"Validation exception: {validationEx.Message}");
                    break;
                case UnauthorizedException unauthorizedEx:
                    response.StatusCode = (int)HttpStatusCode.Forbidden;
                    response.Message = unauthorizedEx.Message;
                    _logger.LogWarning(unauthorizedEx, $"Unauthorized access exception: {unauthorizedEx.Message}");
                    break;
                default:
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.Message = _environment.IsDevelopment() ?
                        exception.Message : "An internal server error occurred. Please try again later.";
                    response.Details = _environment.IsDevelopment() ? exception.StackTrace : null;
                    _logger.LogError(exception, $"Unhandled exception: {exception.Message}");
                    break;
            }
            context.Response.StatusCode = response.StatusCode;

            var jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = _environment.IsDevelopment()
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
        }
    }
    public static class ExceptionHandlerMiddlewareExtensions
    {
        public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ExceptionHandlerMiddleware>();
        }
    }
}
