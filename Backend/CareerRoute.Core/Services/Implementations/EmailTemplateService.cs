using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CareerRoute.Core.Services.Implementations
{
    public class EmailTemplateService : IEmailTemplateService
    {
        private readonly IConfiguration _configuration;

        public EmailTemplateService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateMenteeConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            return $@"
        <h2>Session Confirmed!</h2>
        <p>Dear {mentee.FirstName},</p>
        <p>Your mentorship session has been confirmed.</p>
        
        <h3>Session Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {session.Topic}</li>
            <li><strong>Mentor:</strong> {mentor.User.FullName}</li>
            <li><strong>Date:</strong> {session.ScheduledStartTime:MMMM dd, yyyy}</li>
            <li><strong>Time:</strong> {session.ScheduledStartTime:hh:mm tt}</li>
            <li><strong>Duration:</strong> {(int)session.Duration} minutes</li>
            <li><strong>Meeting Link:</strong> <a href='{session.VideoConferenceLink}'>{session.VideoConferenceLink}</a></li>
        </ul>
        
        <h3>Payment Details:</h3>
        <ul>
            <li><strong>Amount Paid:</strong> {payment.Amount:C} {payment.Currency}</li>
            <li><strong>Transaction ID:</strong> {payment.ProviderTransactionId}</li>
        </ul>
        <p>We look forward to your session!</p>
    ";
        }
        public string GenerateMentorConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            var platformFee = payment.Amount * 0.15m;

            return $@"
        <h2>New Session Booked!</h2>
        <p>Dear {mentor.User.FullName},</p>
        <p>A new mentorship session has been booked with you.</p>
        
        <h3>Session Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {session.Topic}</li>
            <li><strong>Mentee:</strong> {mentee.FullName}</li>
            <li><strong>Date:</strong> {session.ScheduledStartTime:MMMM dd, yyyy}</li>
            <li><strong>Time:</strong> {session.ScheduledStartTime:hh:mm tt}</li>
            <li><strong>Duration:</strong> {(int)session.Duration} minutes</li>
            <li><strong>Meeting Link:</strong> <a href='{session.VideoConferenceLink}'>{session.VideoConferenceLink}</a></li>
        </ul>
        
        <h3>Earnings:</h3>
        <ul>
            <li><strong>Session Price:</strong> {payment.Amount:C} {payment.Currency}</li>
            <li><strong>Platform Fee (15%):</strong> {platformFee:C} {payment.Currency}</li>
            <li><strong>Your Earnings:</strong> {payment.MentorPayoutAmount:C} {payment.Currency}</li>
            <li><strong>Payout Date:</strong> {payment.PaymentReleaseDate:MMMM dd, yyyy}</li>
        </ul>
        <p>Please be ready for the session at the scheduled time.</p>
    ";
        }

        public string GenerateSessionBookedEmail(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            var platformFee = payment.Amount * 0.15m;

            return $@"
        <h2>New Session Booked!</h2>
        <p>Dear {mentor.User.FullName},</p>
        <p>A new mentorship session has been booked with you.</p>
        
        <h3>Session Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {session.Topic}</li>
            <li><strong>Mentee:</strong> {mentee.FullName}</li>
            <li><strong>Date:</strong> {session.ScheduledStartTime:MMMM dd, yyyy}</li>
            <li><strong>Time:</strong> {session.ScheduledStartTime:hh:mm tt}</li>
            <li><strong>Duration:</strong> {(int)session.Duration} minutes</li>
            <li><strong>Meeting Link:</strong> <a href='{session.VideoConferenceLink}'>{session.VideoConferenceLink}</a></li>
        </ul>
        
        <h3>Earnings:</h3>
        <ul>
            <li><strong>Session Price:</strong> {payment.Amount:C} {payment.Currency}</li>
            <li><strong>Platform Fee (15%):</strong> {platformFee:C} {payment.Currency}</li>
            <li><strong>Your Earnings:</strong> {payment.MentorPayoutAmount:C} {payment.Currency}</li>
            <li><strong>Payout Date:</strong> {payment.PaymentReleaseDate:MMMM dd, yyyy}</li>
        </ul>
        <p>Please be ready for the session at the scheduled time.</p>
    ";
        }

        public string GenerateCancellationEmail(Session session, CancelSession cancel, bool isMentee)
        {
            if (isMentee)
            {
                if (cancel.RefundPercentage == 100)
                {
                    return $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is more than 48 hours before the session, you will receive a <strong>100% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";
                }
                else if (cancel.RefundPercentage == 50)
                {
                    return $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is 24–48 hours before the session, you will receive a <strong>50% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";
                }
                else
                {
                    return $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is less than 24 hours before the session, <strong>no refund</strong> will be issued.</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";
                }
            }
            else // Mentor email
            {
                if (cancel.RefundPercentage == 100)
                {
                    return $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>The mentee will receive a <strong>100% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
                }
                else if (cancel.RefundPercentage == 50)
                {
                    return $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>The mentee will receive a <strong>50% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
                }
                else
                {
                    return $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>No refund will be issued to the mentee.</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
                }
            }
        }

        public string GenerateRescheduleRequestEmail(Session session, RescheduleSession reschedule, string receiverName, string requesterName)
        {
            var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:4200";
            var reschedulePageLink = $"{frontendUrl}/sessions/reschedule/{reschedule.Id}";

            return $@"
            <h2>Session Reschedule Request</h2>

            <p>Dear {receiverName},</p>

            <p>The session with <b>{requesterName}</b> is requested to be rescheduled.</p>

            <p><b>Original time:</b> {reschedule.OriginalStartTime:yyyy-MM-dd HH:mm}</p>
            <p><b>Requested new time:</b> {reschedule.NewScheduledStartTime:yyyy-MM-dd HH:mm}</p>

            <p>Please review and respond to this request within 48 hours:</p>

            <a href='{reschedulePageLink}' style='padding:10px 20px;background:#2196F3;color:white;text-decoration:none;border-radius:6px;display:inline-block;'>Review Reschedule Request</a>

            <br /><br />
            <p>Thank you.</p>
            ";
        }

        public string GenerateRescheduleApprovedEmail(Session session, RescheduleSession reschedule, string receiverName)
        {
            return $@"
            <h2>Reschedule Request Approved</h2>
            <p>Dear {receiverName},</p>
            <p>Your reschedule request has been <strong>approved</strong>.</p>
            <p><b>Original time:</b> {reschedule.OriginalStartTime:yyyy-MM-dd HH:mm}</p>
            <p><b>New time:</b> {reschedule.NewScheduledStartTime:yyyy-MM-dd HH:mm}</p>
            <p>Your session will now take place at the new time.</p>
            <p>Thank you.</p>
            ";
        }

        public string GenerateRescheduleRejectedEmail(Session session, RescheduleSession reschedule, string receiverName)
        {
            return $@"
            <h2>Reschedule Request Rejected</h2>
            <p>Dear {receiverName},</p>
            <p>Your reschedule request has been <strong>rejected</strong>.</p>
            <p>Your session will remain at the original time: <b>{reschedule.OriginalStartTime:yyyy-MM-dd HH:mm}</b></p>
            <p>Thank you.</p>
            ";
        }

        public string GenerateSessionCompletionEmail(Session session, string menteeName)
        {
            return $@"
            <h2>Session Completed</h2>
            <p>Dear {menteeName},</p>
            <p>Your session on <strong>{session.ScheduledStartTime:MMMM dd, yyyy}</strong> has been marked as completed.</p>
            <p>We hope you had a great experience!</p>
            <p>Please consider leaving a review for your mentor.</p>
            <p>Thank you for using our platform.</p>
            ";
        }
    }
}
