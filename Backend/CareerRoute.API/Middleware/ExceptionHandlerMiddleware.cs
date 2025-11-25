using CareerRoute.API.Models;
using CareerRoute.Core.Exceptions;
using Microsoft.EntityFrameworkCore;

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
                    _logger.LogWarning("[404] Not Found: {Message}", notFoundEx.Message);
                    break;

                case BusinessException businessEx:
                    response = ApiResponse.Error(businessEx.Message, 400);
                    _logger.LogWarning("[400] Business Rule: {Message}", businessEx.Message);
                    break;

                case ConflictException conflictEx:
                    response = ApiResponse.Error(conflictEx.Message, 409);
                    _logger.LogWarning("[409] Conflict: {Message}", conflictEx.Message);
                    break;

                case ValidationException validationEx:
                    response = ApiResponse.Error(validationEx.Message, 400, validationEx.Errors);
                    var errorDetails = validationEx.Errors.Any() 
                        ? string.Join("; ", validationEx.Errors.SelectMany(e => e.Value)) 
                        : validationEx.Message;
                    _logger.LogWarning("[400] Validation: {Message}", errorDetails);
                    break;

                case UnauthenticatedException unauthenticatedEx:
                    response = ApiResponse.Error(unauthenticatedEx.Message, 401);
                    _logger.LogWarning("[401] Unauthenticated: {Message}", unauthenticatedEx.Message);
                    break;

                case UnauthorizedException unauthorizedEx:
                    response = ApiResponse.Error(unauthorizedEx.Message, 403);
                    _logger.LogWarning("[403] Unauthorized: {Message}", unauthorizedEx.Message);
                    break;

                case SendEmailException emailException:
                    response = ApiResponse.Error(emailException.Message, 400);
                    _logger.LogWarning("[400] Email: {Message}", emailException.Message);
                    break;

                case PaymentException paymentEx:
                    var paymentErrorData = new Dictionary<string, string[]>();

                    if (!string.IsNullOrWhiteSpace(paymentEx.PaymentProvider))
                        paymentErrorData["paymentProvider"] = [paymentEx.PaymentProvider];

                    if (!string.IsNullOrWhiteSpace(paymentEx.PaymentIntentId))
                        paymentErrorData["paymentIntentId"] = [paymentEx.PaymentIntentId];

                    response = ApiResponse.Error(paymentEx.Message, 400, paymentErrorData);
                    _logger.LogWarning("[400] Payment ({Provider}): {Message}", 
                        paymentEx.PaymentProvider ?? "Unknown", paymentEx.Message);
                    break;

                case GoneException goneException:
                    response = ApiResponse.Error(goneException.Message, 410);
                    _logger.LogWarning("[410] Gone: {Message}", goneException.Message);
                    break;

                case DbUpdateException dbUpdateEx:
                    var dbMessage = dbUpdateEx.InnerException?.Message ?? dbUpdateEx.Message;
                    if (dbMessage.Contains("CK_Cancellation_Reason_MinLength") || dbMessage.Contains("CK_Reschedule_Reason_MinLength"))
                    {
                        response = ApiResponse.Error("Reason must be at least 10 characters.", 400);
                        _logger.LogWarning("[400] DB Validation: Reason minimum length not met");
                    }
                    else if (dbMessage.Contains("CHECK constraint"))
                    {
                        response = ApiResponse.Error("Data validation failed. Please check your input.", 400);
                        _logger.LogWarning("[400] DB Validation: CHECK constraint violated");
                    }
                    else if (dbMessage.Contains("UNIQUE constraint") || dbMessage.Contains("duplicate key"))
                    {
                        response = ApiResponse.Error("A record with this information already exists.", 409);
                        _logger.LogWarning("[409] DB Conflict: Duplicate record");
                    }
                    else if (dbMessage.Contains("FOREIGN KEY constraint"))
                    {
                        response = ApiResponse.Error("Referenced record does not exist.", 400);
                        _logger.LogWarning("[400] DB Validation: Foreign key constraint violated");
                    }
                    else
                    {
                        response = ApiResponse.Error("Database operation failed. Please try again.", 500);
                        _logger.LogError(dbUpdateEx, "[500] Database Error: {Message}", dbMessage);
                    }
                    break;

                default:
                    var message = _environment.IsDevelopment()
                        ? exception.Message
                        : "An internal server error occurred. Please try again later.";
                    response = ApiResponse.Error(message, 500);
                    _logger.LogError(exception, "[500] Unhandled: {Message}", exception.Message);
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
