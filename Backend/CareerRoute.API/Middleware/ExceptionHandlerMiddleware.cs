using CareerRoute.API.Models;
using CareerRoute.Core.Exceptions;


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

            ApiResponse response;

            switch (exception)
            {
                case NotFoundException notFoundEx:
                    response = ApiResponse.Error(notFoundEx.Message, 404);
                    _logger.LogWarning(notFoundEx, "Resource not found: {Message}", notFoundEx.Message);
                    break;

                case BusinessException businessEx:
                    response = ApiResponse.Error(businessEx.Message, 400);
                    _logger.LogWarning(businessEx, "Business rule violation: {Message}", businessEx.Message);
                    break;

                case ConflictException conflictEx:
                    response = ApiResponse.Error(conflictEx.Message, 409);
                    _logger.LogWarning(conflictEx, "Resource conflict: {Message}", conflictEx.Message);
                    break;

                case ValidationException validationEx:
                    response = ApiResponse.Error(validationEx.Message, 400, validationEx.Errors);
                    _logger.LogWarning(validationEx, "Validation exception: {Message}", validationEx.Message);
                    break;

                case UnauthenticatedException unauthenticatedEx:
                    response = ApiResponse.Error(unauthenticatedEx.Message, 401);
                    _logger.LogWarning(unauthenticatedEx, "Unauthenticated: {Message}", unauthenticatedEx.Message);
                    break;

                case UnauthorizedException unauthorizedEx:
                    response = ApiResponse.Error(unauthorizedEx.Message, 403);
                    _logger.LogWarning(unauthorizedEx, "Unauthorized access: {Message}", unauthorizedEx.Message);
                    break;
                case SendEmailException emailException:
                    response = ApiResponse.Error(emailException.Message, 400);
                    _logger.LogWarning(emailException, $"Send Email exception: {emailException.Message}");
                    break;
                default:
                    var message = _environment.IsDevelopment()
                        ? exception.Message
                        : "An internal server error occurred. Please try again later.";
                    response = ApiResponse.Error(message, 500);
                    _logger.LogError(exception, "Unhandled exception: {Message}", exception.Message);
                    break;
            }

            context.Response.StatusCode = response.StatusCode ?? 500;

            await context.Response.WriteAsJsonAsync(response);
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
