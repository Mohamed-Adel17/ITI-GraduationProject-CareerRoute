using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Options;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace CareerRoute.Infrastructure.Services
{
    public class SendGridEmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public SendGridEmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value ?? throw new ArgumentNullException(nameof(emailSettings));
        }

        public async Task SendEmailAsync(string to, string subject, string plainTextContent, string htmlContent)
        {
            if (string.IsNullOrWhiteSpace(to))
                throw new ArgumentException("Recipient email cannot be empty.", nameof(to));

            try
            {
                var client = new SendGridClient(_emailSettings.SendGridApiKey);
                var from = new EmailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName);
                var recipient = new EmailAddress(to);
                var message = MailHelper.CreateSingleEmail(from, recipient, subject, plainTextContent, htmlContent);

                var response = await client.SendEmailAsync(message);

                if (!response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    throw new SendEmailException($"Failed to send email: {response.StatusCode}, {responseBody}");
                }
            }
            catch (Exception ex) when (ex is not SendEmailException)
            {
                throw new SendEmailException("An error occurred while sending the email.", ex);
            }
        }

        public async Task SendEmailWithCalendarAsync(string to, string subject, string plainTextContent, string htmlContent, string calendarContent, string calendarFileName = "invite.ics")
        {
            if (string.IsNullOrWhiteSpace(to))
                throw new ArgumentException("Recipient email cannot be empty.", nameof(to));

            if (string.IsNullOrWhiteSpace(calendarContent))
                throw new ArgumentException("Calendar content cannot be empty.", nameof(calendarContent));

            try
            {
                var client = new SendGridClient(_emailSettings.SendGridApiKey);
                var from = new EmailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName);
                var recipient = new EmailAddress(to);
                var message = MailHelper.CreateSingleEmail(from, recipient, subject, plainTextContent, htmlContent);

                // Add calendar invitation as attachment
                var calendarBytes = System.Text.Encoding.UTF8.GetBytes(calendarContent);
                var calendarBase64 = Convert.ToBase64String(calendarBytes);
                message.AddAttachment(calendarFileName, calendarBase64, "text/calendar", "attachment");

                var response = await client.SendEmailAsync(message);

                if (!response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Body.ReadAsStringAsync();
                    throw new SendEmailException($"Failed to send email with calendar: {response.StatusCode}, {responseBody}");
                }
            }
            catch (Exception ex) when (ex is not SendEmailException)
            {
                throw new SendEmailException("An error occurred while sending the email with calendar.", ex);
            }
        }

    }
}
