using CareerRoute.Core.Services.Interfaces;
using System.Text;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Service implementation for calendar invitation generation in iCalendar format
    /// </summary>
    public class CalendarService : ICalendarService
    {
        /// <summary>
        /// Generates an iCalendar format invitation for a session
        /// </summary>
        public string GenerateCalendarInvitation(
            string sessionId,
            string topic,
            DateTime startTime,
            DateTime endTime,
            string location,
            string description,
            List<string> attendeeEmails,
            string organizerEmail,
            string organizerName)
        {
            var calendar = new StringBuilder();
            
            // iCalendar header
            calendar.AppendLine("BEGIN:VCALENDAR");
            calendar.AppendLine("VERSION:2.0");
            calendar.AppendLine("PRODID:-//CareerRoute//Mentorship Session//EN");
            calendar.AppendLine("METHOD:REQUEST");
            calendar.AppendLine("CALSCALE:GREGORIAN");
            
            // Event details
            calendar.AppendLine("BEGIN:VEVENT");
            
            // Unique identifier for the event
            calendar.AppendLine($"UID:{sessionId}@careerroute.com");
            
            // Timestamp
            calendar.AppendLine($"DTSTAMP:{FormatDateTime(DateTime.UtcNow)}");
            
            // Start and end times (in UTC)
            calendar.AppendLine($"DTSTART:{FormatDateTime(startTime)}");
            calendar.AppendLine($"DTEND:{FormatDateTime(endTime)}");
            
            // Summary (title)
            calendar.AppendLine($"SUMMARY:{EscapeText(topic)}");
            
            // Description
            calendar.AppendLine($"DESCRIPTION:{EscapeText(description)}");
            
            // Location (Zoom link)
            calendar.AppendLine($"LOCATION:{EscapeText(location)}");
            
            // Organizer
            calendar.AppendLine($"ORGANIZER;CN={EscapeText(organizerName)}:mailto:{organizerEmail}");
            
            // Attendees
            foreach (var attendeeEmail in attendeeEmails)
            {
                calendar.AppendLine($"ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:{attendeeEmail}");
            }
            
            // Status
            calendar.AppendLine("STATUS:CONFIRMED");
            
            // Sequence (increment for updates)
            calendar.AppendLine("SEQUENCE:1");
            
            // Priority
            calendar.AppendLine("PRIORITY:5");
            
            // Reminder (15 minutes before)
            calendar.AppendLine("BEGIN:VALARM");
            calendar.AppendLine("TRIGGER:-PT15M");
            calendar.AppendLine("ACTION:DISPLAY");
            calendar.AppendLine($"DESCRIPTION:Reminder: {EscapeText(topic)}");
            calendar.AppendLine("END:VALARM");
            
            calendar.AppendLine("END:VEVENT");
            calendar.AppendLine("END:VCALENDAR");
            
            return calendar.ToString();
        }
        
        /// <summary>
        /// Formats DateTime to iCalendar format (yyyyMMddTHHmmssZ)
        /// </summary>
        private string FormatDateTime(DateTime dateTime)
        {
            // Ensure UTC
            var utcDateTime = dateTime.Kind == DateTimeKind.Utc 
                ? dateTime 
                : dateTime.ToUniversalTime();
            
            return utcDateTime.ToString("yyyyMMddTHHmmss") + "Z";
        }
        
        /// <summary>
        /// Escapes special characters in iCalendar text fields
        /// </summary>
        private string EscapeText(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;
            
            return text
                .Replace("\\", "\\\\")
                .Replace(",", "\\,")
                .Replace(";", "\\;")
                .Replace("\n", "\\n")
                .Replace("\r", "");
        }
    }
}
