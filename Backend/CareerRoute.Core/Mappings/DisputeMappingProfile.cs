using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Disputes;

namespace CareerRoute.Core.Mappings
{
    public class DisputeMappingProfile : Profile
    {
        public DisputeMappingProfile()
        {
            CreateMap<SessionDispute, DisputeDto>();
        }
    }
}
