using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Payouts;

namespace CareerRoute.Core.Mappings
{
    public class PayoutMappingProfile : Profile
    {
        public PayoutMappingProfile()
        {
            CreateMap<MentorBalance, MentorBalanceDto>()
                .ForMember(dest => dest.LastUpdated, opt => opt.MapFrom(src => src.UpdatedAt));

            CreateMap<Payout, PayoutDto>();

            CreateMap<Payout, AdminPayoutDto>()
                .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Mentor.User.LastName))
                .ForMember(dest => dest.MentorEmail, opt => opt.MapFrom(src => src.Mentor.User.Email));
        }
    }
}
