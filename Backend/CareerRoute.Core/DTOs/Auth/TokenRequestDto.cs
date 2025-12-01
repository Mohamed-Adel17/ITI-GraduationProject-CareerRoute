using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;


namespace CareerRoute.Core.DTOs.Auth
{
    public class TokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
