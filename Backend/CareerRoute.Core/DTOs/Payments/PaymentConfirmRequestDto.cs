using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentConfirmRequestDto
    {
        public string PaymentIntentId { get; set; }

        public string SessionId { get; set; }
    }
}
