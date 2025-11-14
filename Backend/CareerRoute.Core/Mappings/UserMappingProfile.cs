using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Skills;
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
                .ForMember(dest => dest.Roles, opt => opt.Ignore());

            CreateMap<ApplicationUser, RetrieveUserDto>()
                .ForMember(dest => dest.CareerInterests, opt => opt.MapFrom(src =>
                    src.UserSkills
                        .Where(us => us.Skill.IsActive)
                        .Select(us => new SkillDto
                        {
                            Id = us.Skill.Id,
                            Name = us.Skill.Name,
                            CategoryId = us.Skill.CategoryId,
                            CategoryName = us.Skill.Category.Name,
                            IsActive = us.Skill.IsActive
                        })
                        .ToList()));

            //map only not null fields (excluding CareerInterestIds which is handled separately)
            CreateMap<UpdateUserDto, ApplicationUser>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
