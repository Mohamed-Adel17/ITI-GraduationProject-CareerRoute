using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Settings
{
    public class EmailSettings
    {
        public required string SendGridApiKey { get; set; }= string.Empty;
        public required string SenderEmail { get; set; }= string.Empty;
        public required string SenderName { get; set; } = string.Empty;
    }


}
