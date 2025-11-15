using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payments;
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
            // Map PaymentRequestDto → Payment
            CreateMap<PaymentIntentRequestDto, Payment>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => PaymentStatusOptions.Pending))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ClientSecret, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentIntentId, opt => opt.Ignore())
                .ForMember(dest => dest.Amount, opt => opt.Ignore())
                .ForMember(dest => dest.Session, opt => opt.Ignore());

            // Map PaymentConfirmRequestDto → Payment (used to update PaymentIntentId)
            CreateMap<PaymentConfirmRequestDto, Payment>()
                .ForMember(dest => dest.Session, opt => opt.Ignore())
                .ForMember(dest => dest.Amount, opt => opt.Ignore())
                .ForMember(dest => dest.ClientSecret, opt => opt.Ignore())
                .ForMember(dest => dest.PaymentMethod, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => PaymentStatusOptions.Captured));

            CreateMap<Payment, PaymentIntentResponseDto>();

            CreateMap<Payment, PaymentConfirmResponseDto>()
                .ForMember(dest => dest.PaymentId, opt => opt.MapFrom(src => src.Id));



        }
    }
}
