using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, string htmlContent);
        
        /// <summary>
        /// Sends an email with a calendar invitation attachment
        /// </summary>
        Task SendEmailWithCalendarAsync(string to, string subject, string body, string htmlContent, string calendarContent, string calendarFileName = "invite.ics");
    }
}
