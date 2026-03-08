using Klarity.Api.Data;
using Klarity.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Klarity.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContainersController : ControllerBase
    {
        private readonly IPredefinedContainerRepository _predefinedContainerRepository;
        private readonly ILogger<ContainersController> _logger;

        public ContainersController(
            IPredefinedContainerRepository predefinedContainerRepository, 
            ILogger<ContainersController> logger)
        {
            _predefinedContainerRepository = predefinedContainerRepository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PredefinedContainer>>> GetContainers()
        {
            try
            {
                var containers = await _predefinedContainerRepository.GetContainersAsync();
                return Ok(containers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving predefined containers");
                return StatusCode(500, "An error occurred while retrieving containers.");
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PredefinedContainer>> GetContainer(string id)
        {
            try
            {
                var container = await _predefinedContainerRepository.GetContainerByIdAsync(id);
                if (container == null)
                    return NotFound();

                return Ok(container);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving predefined container {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the container.");
            }
        }

        [HttpPost]
        public async Task<ActionResult<PredefinedContainer>> CreateContainer([FromBody] PredefinedContainer container)
        {
            try
            {
                if (string.IsNullOrEmpty(container.ContainerId))
                {
                    container.ContainerId = "cont-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                }

                var id = await _predefinedContainerRepository.CreateContainerAsync(container);
                container.ContainerId = id;

                return CreatedAtAction(nameof(GetContainer), new { id = container.ContainerId }, container);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating predefined container");
                return StatusCode(500, "An error occurred while creating the container.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateContainer(string id, [FromBody] PredefinedContainer container)
        {
            if (id != container.ContainerId)
                return BadRequest("Container ID mismatch");

            try
            {
                var success = await _predefinedContainerRepository.UpdateContainerAsync(container);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating predefined container {Id}", id);
                return StatusCode(500, "An error occurred while updating the container.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteContainer(string id)
        {
            try
            {
                var success = await _predefinedContainerRepository.DeleteContainerAsync(id);
                if (!success)
                    return NotFound();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting predefined container {Id}", id);
                return StatusCode(500, "An error occurred while deleting the container.");
            }
        }
    }
}
