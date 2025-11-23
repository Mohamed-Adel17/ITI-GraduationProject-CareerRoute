namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for calendar invitation generation
    /// </summary>
    public interface ICalendarService
    {
        /// <summary>
        /// Generates an iCalendar format invitation for a session
        /// </summary>
        /// <param name="sessionId">The session ID</param>
        /// <param name="topic">The session topic</param>
        /// <param name="startTime">The session start time</param>
        /// <param name="endTime">The session end time</param>
        /// <param name="location">The video conference link</param>
        /// <param name="description">Additional session details</param>
        /// <param name="attendeeEmails">List of attendee email addresses</param>
        /// <param name="organizerEmail">The organizer's email address</param>
        /// <param name="organizerName">The organizer's name</param>
        /// <returns>iCalendar format string</returns>
        string GenerateCalendarInvitation(
            string sessionId,
            string topic,
            DateTime startTime,
            DateTime endTime,
            string location,
            string description,
            List<string> attendeeEmails,
            string organizerEmail,
            string organizerName);
    }
}
