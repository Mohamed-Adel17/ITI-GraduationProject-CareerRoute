using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IEmailTemplateService
    {
        /// <summary>
        /// Generates session confirmation email for mentee
        /// </summary>
        string GenerateMenteeConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee);
        /// <summary>
        /// Generates session confirmation email for mentor
        /// </summary>
        string GenerateMentorConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee);

        /// <summary>
        /// Generates session booked notification email for mentor
        /// </summary>
        string GenerateSessionBookedEmail(Session session, Payment payment, Mentor mentor, ApplicationUser mentee);

        /// <summary>
        /// Generates cancellation email (for both mentee and mentor)
        /// </summary>
        string GenerateCancellationEmail(Session session, CancelSession cancel, bool isMentee);

        /// <summary>
        /// Generates reschedule request email
        /// </summary>
        string GenerateRescheduleRequestEmail(Session session, RescheduleSession reschedule, string receiverName, string requesterName);

        /// <summary>
        /// Generates reschedule approved email
        /// </summary>
        string GenerateRescheduleApprovedEmail(Session session, RescheduleSession reschedule, string receiverName);

        /// <summary>
        /// Generates reschedule rejected email
        /// </summary>
        string GenerateRescheduleRejectedEmail(Session session, RescheduleSession reschedule, string receiverName);

        /// <summary>
        /// Generates session completion email for mentee
        /// </summary>
        string GenerateSessionCompletionEmail(Session session, string menteeName);
    }
}
