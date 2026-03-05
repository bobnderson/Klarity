using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Klarity.Api.Data;
using Klarity.Api.Models.Aviation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

using Klarity.Api.Utils;

namespace Klarity.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [TokenAuthorize]
    public class FlightSchedulesController : ControllerBase
    {
        private readonly IFlightScheduleRepository _repository;
        private readonly ILogger<FlightSchedulesController> _logger;

        public FlightSchedulesController(IFlightScheduleRepository repository, ILogger<FlightSchedulesController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlightSchedule>>> GetSchedules()
        {
            try
            {
                var schedules = await _repository.GetSchedulesAsync();
                return Ok(schedules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving flight schedules");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FlightSchedule>> GetSchedule(string id)
        {
            try
            {
                var schedule = await _repository.GetScheduleByIdAsync(id);
                if (schedule == null) return NotFound();
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving flight schedule {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<FlightSchedule>> CreateSchedule(FlightSchedule schedule)
        {
            try
            {
                var id = await _repository.CreateScheduleAsync(schedule);
                schedule.ScheduleId = id;
                return CreatedAtAction(nameof(GetSchedule), new { id }, schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating flight schedule");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSchedule(string id, FlightSchedule schedule)
        {
            if (id != schedule.ScheduleId) return BadRequest();

            try
            {
                await _repository.UpdateScheduleAsync(schedule);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating flight schedule {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSchedule(string id)
        {
            try
            {
                await _repository.DeleteScheduleAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting flight schedule {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
