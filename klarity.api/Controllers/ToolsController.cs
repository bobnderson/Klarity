using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Utils;

namespace Klarity.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ToolsController : ControllerBase
    {
        private readonly Security _security;

        public ToolsController(Security security)
        {
            _security = security;
        }

        [HttpGet("encrypt")]
        public IActionResult Encrypt([FromQuery] string text)
        {
            try
            {
                var encrypted = _security.Encrypt(text);
                return Ok(new { Original = text, Encrypted = encrypted });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("decrypt")]
        public IActionResult Decrypt([FromQuery] string text)
        {
            try
            {
                var decrypted = _security.Decrypt(text);
                return Ok(new { Original = text, Decrypted = decrypted });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
