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
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<ApplicationUser, UserDto>()
            .ForMember(dest => dest.Roles, opt => opt.Ignore())
            .ForMember(dest => dest.IsMentor, opt => opt.Ignore());


            
            CreateMap<ApplicationUser, RetriveUserDto>();

            //map only not null fields
            CreateMap<UpdateUserDto, ApplicationUser>()
           .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));



        }
    }
}
