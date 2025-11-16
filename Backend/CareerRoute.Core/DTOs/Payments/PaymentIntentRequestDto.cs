using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentIntentRequestDto
    {
        public string SessionId { get; set; }

        public PaymentMethodOptions PaymentMethod { get; set; }
    }
}
