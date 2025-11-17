using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Enums
{
    public enum PaymentProviderOptions
    {
        Stripe,
        Paymob
    }
    
    public enum PaymobPaymentMethodOptions
    {
        Card,
        EWallet
    }
}
