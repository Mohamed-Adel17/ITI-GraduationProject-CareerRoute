using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace CareerRoute.Core.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile()
        {
            CreateMap<CreateUserDto, ApplicationUser>() //src , dest
            .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.UserName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            .ForMember(dest => dest.CareerGoal, opt => opt.MapFrom(src => src.CareerGoal))
            .ForMember(dest => dest.CareerInterst, opt => opt.MapFrom(src => src.CareerInterst))

            //ignore Password , Role from mapping + will be added manually in the UserService using manager
            .ForSourceMember(src => src.Role, opt => opt.DoNotValidate())
            .ForSourceMember(src => src.Password, opt => opt.DoNotValidate());



            CreateMap<ApplicationUser, RetriveUserDto>();

            //map only not null fields
            CreateMap<UpdateUserDto, ApplicationUser>()
           .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        }
    }
}
