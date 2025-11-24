using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Enums
{
    public enum PaymentProviderOptions
    {
        Stripe=1,
        Paymob
    }
    
    public enum PaymobPaymentMethodOptions
    {
        Card=1,
        EWallet
    }
}
