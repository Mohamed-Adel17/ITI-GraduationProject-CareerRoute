using CareerRoute.API.Filters;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CareerRoute.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[AuthorizeRole(AppRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService userService;


        public UsersController()
        {


        }
    }
}
