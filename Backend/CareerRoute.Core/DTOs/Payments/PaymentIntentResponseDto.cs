using CareerRoute.Core.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentIntentResponseDto
    {
        
            public string PaymentIntentId { get; set; }
            public string ClientSecret { get; set; }
            public decimal Amount { get; set; }
            public string Currency { get; set; }
            public string SessionId { get; set; }
            public PaymentMethodOptions PaymentMethod { get; set; }
            public string Status { get; set; }
      
    }
}
