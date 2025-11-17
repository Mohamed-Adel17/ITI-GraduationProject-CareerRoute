using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payments;
using CareerRoute.Core.DTOs.Sessions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Mappings
{
    public class PaymentProfile : Profile
    {

        public PaymentProfile()
        {
            CreateMap<Payment, PaymentIntentResponseDto>();

            CreateMap<Payment, PaymentConfirmResponseDto>()
                .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => src.Id));

            // Session → SessionPaymentResponseDto
            CreateMap<Session, SessionPaymentResponseDto>();

            // Payment → PaymentConfirmResponseDto
            CreateMap<Payment, PaymentConfirmResponseDto>()
                .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => src.ProviderTransactionId));
            // Payment → PaymentHistroyItemResponseDto
            CreateMap<Payment, PaymentHistroyItemResponseDto>()
                .ForMember(dest => dest.MentorName, opt => opt.MapFrom(src => src.Session.Mentor.User.FullName))
                .ForMember(dest => dest.SessionTopic, opt => opt.MapFrom(src => src.Session.Topic))
                .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod.ToString()))
                .ForMember(dest => dest.TransactionId, opt => opt.MapFrom(src => src.ProviderTransactionId));
        }
    }
}
