using Klarity.Api.Data;
using Klarity.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klarity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HelicoptersController : ControllerBase
{
    private readonly IHelicopterRepository _helicopterRepository;
    private readonly ILogger<HelicoptersController> _logger;

    public HelicoptersController(IHelicopterRepository helicopterRepository, ILogger<HelicoptersController> logger)
    {
        _helicopterRepository = helicopterRepository;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Helicopter>>> GetHelicopters(string? statusId = null)
    {
        try
        {
            var helicopters = await _helicopterRepository.GetHelicoptersAsync(statusId);
            return Ok(helicopters);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching helicopters");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Helicopter>> GetHelicopter(string id)
    {
        try
        {
            var helicopter = await _helicopterRepository.GetHelicopterByIdAsync(id);
            if (helicopter == null) return NotFound();
            return Ok(helicopter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching helicopter {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<Helicopter>> CreateHelicopter(Helicopter helicopter)
    {
        try
        {
            await _helicopterRepository.CreateHelicopterAsync(helicopter);
            return CreatedAtAction(nameof(GetHelicopter), new { id = helicopter.HelicopterId }, helicopter);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating helicopter");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHelicopter(string id, Helicopter helicopter)
    {
        if (id != helicopter.HelicopterId)
        {
            return BadRequest();
        }

        try
        {
            await _helicopterRepository.UpdateHelicopterAsync(helicopter);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating helicopter {HelicopterId}", id);
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHelicopter(string id)
    {
        try
        {
            await _helicopterRepository.DeleteHelicopterAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting helicopter {Id}", id);
            return StatusCode(500, "Internal server error");
        }
    }
}
