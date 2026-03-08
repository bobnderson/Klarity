using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Klarity.Api.Data;
using Klarity.Api.Models.Marine;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Klarity.Api.Utils;

namespace Klarity.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [TokenAuthorize]
    public class VoyageSchedulesController : ControllerBase
    {
        private readonly IVoyageScheduleRepository _repository;
        private readonly ILogger<VoyageSchedulesController> _logger;

        public VoyageSchedulesController(IVoyageScheduleRepository repository, ILogger<VoyageSchedulesController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<VoyageSchedule>>> GetSchedules()
        {
            try
            {
                var schedules = await _repository.GetSchedulesAsync();
                return Ok(schedules);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving voyage schedules");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<VoyageSchedule>> GetSchedule(string id)
        {
            try
            {
                var schedule = await _repository.GetScheduleByIdAsync(id);
                if (schedule == null) return NotFound();
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving voyage schedule {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<VoyageSchedule>> CreateSchedule(VoyageSchedule schedule)
        {
            try
            {
                var id = await _repository.CreateScheduleAsync(schedule);
                schedule.ScheduleId = id;
                return CreatedAtAction(nameof(GetSchedule), new { id }, schedule);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating voyage schedule");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSchedule(string id, VoyageSchedule schedule)
        {
            if (id != schedule.ScheduleId) return BadRequest();

            try
            {
                await _repository.UpdateScheduleAsync(schedule);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating voyage schedule {Id}", id);
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
                _logger.LogError(ex, "Error deleting voyage schedule {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
