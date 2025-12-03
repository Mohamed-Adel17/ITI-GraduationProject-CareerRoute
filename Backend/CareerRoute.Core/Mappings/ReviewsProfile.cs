using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Notifications;
using CareerRoute.Core.DTOs.Reviews;
using CareerRoute.Core.DTOs.Sessions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Mappings
{
    public class ReviewsProfile : Profile
    {

        public ReviewsProfile()
        {
            CreateMap<CreateReviewRequestDto, ReviewSession>();

            CreateMap<ReviewSession, CreateReviewResponseDto>()
                .ForMember(dest => dest.SessionId, opt => opt.MapFrom(src => src.Session.Id))
                .ForMember(dest => dest.MenteeId, opt => opt.MapFrom(src => src.Session.Mentee.Id))
                .ForMember(dest => dest.MenteeFirstName, opt => opt.MapFrom(src => src.Session.Mentee.FirstName))
                .ForMember(dest => dest.MenteeLastName, opt => opt.MapFrom(src => src.Session.Mentee.LastName))
                .ForMember(dest => dest.MentorId, opt => opt.MapFrom(src => src.Session.Mentor.Id))
                .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Session.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Session.Mentor.User.LastName));


            CreateMap<ReviewSession, ReviewDetailsItemDto>()
                .ForMember(dest => dest.MentorId, opt => opt.MapFrom(src => src.Session.Mentor.Id))
                .ForMember(dest => dest.MentorFirstName, opt => opt.MapFrom(src => src.Session.Mentor.User.FirstName))
                .ForMember(dest => dest.MentorLastName, opt => opt.MapFrom(src => src.Session.Mentor.User.LastName));
   
      



    }
}
}
