using Dapper;
using Klarity.Api.Models;
using Klarity.Api.Utils;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Klarity.Api.Data;

public interface IVoyageRepository
{
    Task<IEnumerable<Voyage>> GetVoyagesAsync();
    Task<IEnumerable<Voyage>> GetVoyagesByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<Voyage?> GetVoyageByIdAsync(string voyageId);
    Task<IEnumerable<Voyage>> GetVoyagesByVesselIdAsync(string vesselId);
    Task CreateVoyageAsync(Voyage voyage);
    Task UpdateVoyageAsync(Voyage voyage);
    Task DeleteVoyageAsync(string voyageId);
    Task<IEnumerable<VoyageStatus>> GetVoyageStatusesAsync();
    Task AssignItemsToVoyageAsync(string voyageId, List<string> itemIds);
    Task UnassignItemsFromVoyageAsync(string voyageId, List<string> itemIds);
    Task RecalculateVoyageUtilizationAsync(string voyageId);
    Task<IEnumerable<MovementRequest>> GetVoyageManifestAsync(string voyageId);
}

public class VoyageRepository : IVoyageRepository
{
    private readonly IDbConnectionFactory _dbConnectionFactory;
    private readonly Services.IEmailService _emailService;
    private readonly ISettingsRepository _settingsRepository;
    private readonly Services.IPdfService _pdfService;
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly INotificationRepository _notificationRepository;
    private readonly ILogger<VoyageRepository> _logger;

    public VoyageRepository(
        IDbConnectionFactory dbConnectionFactory,
        Services.IEmailService emailService,
        ISettingsRepository settingsRepository,
        Services.IPdfService pdfService,
        IServiceScopeFactory serviceScopeFactory,
        INotificationRepository notificationRepository,
        ILogger<VoyageRepository> logger)
    {
        _dbConnectionFactory = dbConnectionFactory;
        _emailService = emailService;
        _settingsRepository = settingsRepository;
        _pdfService = pdfService;
        _serviceScopeFactory = serviceScopeFactory;
        _notificationRepository = notificationRepository;
        _logger = logger;
    }

    public async Task<IEnumerable<Voyage>> GetVoyagesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.voyage_id, v.vessel_id, v.origin_id, v.destination_id, 
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.schedule_id as ScheduleId,
                ve.vessel_name,
                lo.location_name as origin_name,
                ld.location_name as destination_name,
                vs.status as status_name
            FROM marine.voyages v
            LEFT JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            LEFT JOIN logistics.locations lo ON v.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON v.destination_id = ld.location_id
            LEFT JOIN marine.voyage_statuses vs ON v.status_id = vs.status_id
            WHERE v.is_deleted = 0;";
        
        return await connection.QueryAsync<Voyage>(sql);
    }

    public async Task<IEnumerable<Voyage>> GetVoyagesByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.voyage_id, v.vessel_id, v.origin_id, v.destination_id, 
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.schedule_id as ScheduleId,
                ve.vessel_name,
                lo.location_name as origin_name,
                ld.location_name as destination_name
            FROM marine.voyages v
            LEFT JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            LEFT JOIN logistics.locations lo ON v.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON v.destination_id = ld.location_id
            WHERE v.departure_date_time >= @startDate AND v.departure_date_time <= @endDate AND v.is_deleted = 0";
        
        return await connection.QueryAsync<Voyage>(sql, new { startDate, endDate });
    }

    public async Task<Voyage?> GetVoyageByIdAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string voyageSql = @"
            SELECT 
                v.voyage_id, v.vessel_id, v.origin_id, v.destination_id, 
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.is_deleted, v.schedule_id as ScheduleId,
                ve.vessel_name,
                lo.location_name as origin_name,
                ld.location_name as destination_name
            FROM marine.voyages v
            LEFT JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            LEFT JOIN logistics.locations lo ON v.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON v.destination_id = ld.location_id
            WHERE v.voyage_id = @voyageId AND v.is_deleted = 0";
        
        const string stopsSql = @"
            SELECT s.*, l.location_name
            FROM marine.voyage_stops s
            LEFT JOIN logistics.locations l ON s.location_id = l.location_id
            WHERE s.voyage_id = @voyageId";

        var voyage = await connection.QueryFirstOrDefaultAsync<Voyage>(voyageSql, new { voyageId });
        if (voyage != null)
        {
            var stops = await connection.QueryAsync<VoyageStop>(stopsSql, new { voyageId });
            voyage.Stops = stops.ToList();
        }

        return voyage;
    }

    public async Task<IEnumerable<Voyage>> GetVoyagesByVesselIdAsync(string vesselId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.voyage_id, v.vessel_id, v.origin_id, v.destination_id, 
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.is_deleted, v.schedule_id as ScheduleId,
                ve.vessel_name,
                lo.location_name as origin_name,
                ld.location_name as destination_name
            FROM marine.voyages v
            LEFT JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            LEFT JOIN logistics.locations lo ON v.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON v.destination_id = ld.location_id
            WHERE v.vessel_id = @vesselId AND v.is_deleted = 0";
        
        return await connection.QueryAsync<Voyage>(sql, new { vesselId });
    }

    public async Task CreateVoyageAsync(Voyage voyage)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        
        if (string.IsNullOrEmpty(voyage.VoyageId))
        {
            voyage.VoyageId = "voy-" + Guid.NewGuid().ToString("n").Substring(0, 12).ToLower();
        }

        if (string.IsNullOrEmpty(voyage.StatusId))
        {
            voyage.StatusId = "scheduled";
        }

        const string sql = @"
            INSERT INTO marine.voyages (
                voyage_id, vessel_id, origin_id, destination_id, 
                departure_date_time, eta, weight_util, deck_util, cabin_util, status_id, is_deleted, schedule_id
            ) VALUES (
                @VoyageId, @VesselId, @OriginId, @DestinationId, 
                @DepartureDateTime, @Eta, @WeightUtil, @DeckUtil, @CabinUtil, @StatusId, 0, @ScheduleId
            )";
        
        await connection.ExecuteAsync(sql, voyage);
    }

    public async Task UpdateVoyageAsync(Voyage voyage)
    {
        using var connection = _dbConnectionFactory.CreateConnection();

        // 1. Get existing status to check for changes
        const string checkStatusSql = "SELECT status_id FROM marine.voyages WHERE voyage_id = @VoyageId";
        var existingStatusId = await connection.ExecuteScalarAsync<string>(checkStatusSql, new { voyage.VoyageId });
        
        const string sql = @"
            UPDATE marine.voyages SET
                origin_id = @OriginId, destination_id = @DestinationId, 
                departure_date_time = @DepartureDateTime, eta = @Eta, 
                weight_util = @WeightUtil, deck_util = @DeckUtil, 
                cabin_util = @CabinUtil, status_id = @StatusId
            WHERE voyage_id = @VoyageId";
        
        await connection.ExecuteAsync(sql, voyage);

        // If status is cancelled, unassign all items
        if (voyage.StatusId?.ToLower() == "cancelled")
        {
            await UnassignAllItemsFromVoyageAsync(voyage.VoyageId);
        }
        
        // If status changed to "En route", trigger notification
        var newStatus = voyage.StatusId?.ToLower() ?? "";
        var oldStatus = existingStatusId?.ToLower() ?? "";
        
        _logger.LogInformation("UpdateVoyageAsync: VoyageId={VoyageId}, OldStatus={OldStatus}, NewStatus={NewStatus}", voyage.VoyageId, oldStatus, newStatus);

        if ((newStatus == "enroute" || newStatus == "en route") && newStatus != oldStatus)
        {
             _logger.LogInformation("Triggering manifest notification for {VoyageId}", voyage.VoyageId);
             // Run in background with a new scope
             _ = Task.Run(() => SendManifestOnDepartureBackgroundTask(voyage.VoyageId));
        }
    }

    public async Task DeleteVoyageAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = "UPDATE marine.voyages SET is_deleted = 1 WHERE voyage_id = @voyageId";
        await connection.ExecuteAsync(sql, new { voyageId });
        
        // Also unassign all items when deleting
        await UnassignAllItemsFromVoyageAsync(voyageId);
    }

    private async Task UnassignAllItemsFromVoyageAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();

        // Get all items assigned to this voyage
        const string getItemsSql = "SELECT item_id FROM marine.movement_request_items WHERE assigned_voyage_id = @voyageId";
        var itemIds = await connection.QueryAsync<string>(getItemsSql, new { voyageId });
        
        if (itemIds.Any())
        {
            await UnassignItemsFromVoyageAsync(voyageId, itemIds.ToList());
        }
    }

    public async Task<IEnumerable<VoyageStatus>> GetVoyageStatusesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        return await connection.QueryAsync<VoyageStatus>("SELECT * FROM marine.voyage_statuses");
    }

    public async Task AssignItemsToVoyageAsync(string voyageId, List<string> itemIds)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        
        const string checkStatusSql = "SELECT status_id FROM marine.voyages WHERE voyage_id = @voyageId";
        var statusId = await connection.ExecuteScalarAsync<string>(checkStatusSql, new { voyageId });
        
        if (string.Equals(statusId, "cancelled", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(statusId, "completed", StringComparison.OrdinalIgnoreCase))
        {
             throw new InvalidOperationException($"Cannot assign items to a {statusId} voyage.");
        }

        const string updateItemSql = @"
            UPDATE marine.movement_request_items 
            SET assigned_voyage_id = @voyageId, status = 'Scheduled'
            WHERE item_id = @itemId";
        
        const string updateRequestSql = @"
            UPDATE marine.movement_requests 
            SET status = 'Scheduled'
            WHERE request_id IN (
                SELECT request_id FROM marine.movement_request_items WHERE item_id = @itemId
            )";
        
        foreach (var itemId in itemIds)
        {
            await connection.ExecuteAsync(updateItemSql, new { voyageId, itemId });
            await connection.ExecuteAsync(updateRequestSql, new { itemId });
        }

        await RecalculateVoyageUtilizationAsync(voyageId);

        try 
        {
            await SendAssignmentEmails(voyageId, itemIds);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send notification emails: {ex.Message}");
        }
    }

    public async Task UnassignItemsFromVoyageAsync(string voyageId, List<string> itemIds)
    {
        using var connection = _dbConnectionFactory.CreateConnection();

        const string unassignItemSql = @"
            UPDATE marine.movement_request_items 
            SET assigned_voyage_id = NULL, status = 'Approved'
            WHERE item_id = @itemId AND assigned_voyage_id = @voyageId";
            
        const string checkRequestSql = "SELECT request_id FROM marine.movement_request_items WHERE item_id = @itemId";

        const string updateRequestSql = @"
            UPDATE marine.movement_requests 
            SET status = 'Approved'
            WHERE request_id = @requestId 
            AND NOT EXISTS (
                SELECT 1 FROM marine.movement_request_items 
                WHERE request_id = @requestId AND assigned_voyage_id IS NOT NULL
            )";

        foreach (var itemId in itemIds)
        {
            var requestId = await connection.QueryFirstOrDefaultAsync<string>(checkRequestSql, new { itemId });
            await connection.ExecuteAsync(unassignItemSql, new { voyageId, itemId });
            if (!string.IsNullOrEmpty(requestId))
            {
                await connection.ExecuteAsync(updateRequestSql, new { requestId });
            }
        }

        await RecalculateVoyageUtilizationAsync(voyageId);
    }

    public async Task RecalculateVoyageUtilizationAsync(string voyageId)
    {
        var capacity = await GetVoyageCapacityDetailsAsync(voyageId);
        if (capacity == null) return;

        var items = await GetAssignedItemsForUtilizationAsync(voyageId);
        var metrics = CalculateUtilizationMetrics(items);

        // Calculate final percentages
        double deadWeight = (double)(capacity.dead_weight ?? 1.0);
        double deckArea = (double)(capacity.deck_area ?? 1.0);
        int totalComplement = (int)(capacity.total_complement ?? 1);

        double weightUtil = Math.Round(Math.Min(100, (metrics.TotalWeight / (deadWeight > 0 ? deadWeight : 1)) * 100), 1);
        double deckUtil = Math.Round(Math.Min(100, (metrics.TotalArea / (deckArea > 0 ? deckArea : 1)) * 100), 1);
        double cabinUtil = Math.Round(Math.Min(100, ((double)metrics.PersonnelCount / (totalComplement > 0 ? totalComplement : 1)) * 100), 1);

        await UpdateVoyageUtilizationMetricsAsync(voyageId, weightUtil, deckUtil, cabinUtil);
    }

    private async Task<dynamic?> GetVoyageCapacityDetailsAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT v.vessel_id, ve.dead_weight, ve.deck_area, ve.total_complement
            FROM marine.voyages v
            JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            WHERE v.voyage_id = @voyageId";
            
        return await connection.QueryFirstOrDefaultAsync(sql, new { voyageId });
    }

    private async Task<IEnumerable<dynamic>> GetAssignedItemsForUtilizationAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT i.category_id, i.quantity, i.unit_of_measurement, i.dimensions, i.dimension_unit, i.weight, i.weight_unit, i.container_id,
                   c.length as container_length, c.width as container_width, c.dimension_unit as container_dim_unit
            FROM marine.movement_request_items i
            LEFT JOIN logistics.predefined_containers c ON i.container_id = c.container_id
            WHERE i.assigned_voyage_id = @voyageId";
            
        return await connection.QueryAsync(sql, new { voyageId });
    }

    private (double TotalWeight, double TotalArea, int PersonnelCount) CalculateUtilizationMetrics(IEnumerable<dynamic> items)
    {
        double totalWeight = 0;
        double totalArea = 0;
        int personnelCount = 0;
        var processedContainers = new HashSet<string>();

        foreach (var item in items)
        {
            // Weight calculation
            totalWeight += UnitConverter.ToMetricTonnes((double)(item.weight ?? 0), (string?)item.weight_unit);

            // Area calculation
            string? containerId = (string?)item.container_id;
            if (!string.IsNullOrEmpty(containerId))
            {
                if (processedContainers.Add(containerId))
                {
                    double length = (double)(item.container_length ?? 0);
                    double width = (double)(item.container_width ?? 0);
                    string? dimUnit = (string?)item.container_dim_unit;
                    
                    if (length > 0 && width > 0)
                    {
                        var containerDimensions = $"{length}x{width}";
                        totalArea += UnitConverter.ToSquareMeters(containerDimensions, dimUnit);
                    }
                }
            }
            else
            {
                totalArea += UnitConverter.ToSquareMeters((string?)item.dimensions, (string?)item.dimension_unit) * (double)(item.quantity ?? 1);
            }
        
            // Personnel calculation
            if ((string)item.category_id == "personnel")
            {
                personnelCount += (int)(double)item.quantity;
            }
        }

        return (totalWeight, totalArea, personnelCount);
    }

    private async Task UpdateVoyageUtilizationMetricsAsync(string voyageId, double weightUtil, double deckUtil, double cabinUtil)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            UPDATE marine.voyages 
            SET weight_util = @weightUtil, deck_util = @deckUtil, cabin_util = @cabinUtil
            WHERE voyage_id = @voyageId";

        await connection.ExecuteAsync(sql, new { voyageId, weightUtil, deckUtil, cabinUtil });
    }


    public async Task<IEnumerable<MovementRequest>> GetVoyageManifestAsync(string voyageId)
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                   r.request_id, r.request_date, r.status, r.schedule_indicator, 
                   r.origin_id, r.destination_id, 
                   r.earliest_departure, r.latest_departure, r.earliest_arrival, r.latest_arrival, 
                   r.requested_by, r.urgency_id, r.is_hazardous, 
                   r.request_type_id, r.transportation_required, r.lifting, 
                   r.business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   bu.unit_name as BusinessUnitName,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            LEFT JOIN master.business_units bu ON r.business_unit_id = bu.unit_id
            LEFT JOIN logistics.locations loc_o ON r.origin_id = loc_o.location_id
            LEFT JOIN logistics.locations loc_d ON r.destination_id = loc_d.location_id
            WHERE i.assigned_voyage_id = @voyageId;";

        var requestDictionary = new Dictionary<string, MovementRequest>();

        await connection.QueryAsync<MovementRequest, MovementRequestItem, MovementRequest>(
            sql,
            (request, item) =>
            {
                if (!requestDictionary.TryGetValue(request.RequestId, out var currentRequest))
                {
                    currentRequest = request;
                    currentRequest.Items = new List<MovementRequestItem>();
                    requestDictionary.Add(currentRequest.RequestId, currentRequest);
                }

                if (item != null)
                {
                    currentRequest.Items.Add(item);
                }

                return currentRequest;
            },
            new { voyageId },
            splitOn: "item_id");

        return requestDictionary.Values;
    }
    
    private async Task SendAssignmentEmails(string voyageId, List<string> itemIds)
    {
        var smtpSettings = await _settingsRepository.GetSmtpSettingsAsync();
        if (!smtpSettings.Enabled) return;

        using var connection = _dbConnectionFactory.CreateConnection();
        
        const string voyageSql = @"
            SELECT v.voyage_id, ve.vessel_name, 
                   lo.location_name as origin_name, 
                   ld.location_name as destination_name,
                   v.departure_date_time
            FROM marine.voyages v
            LEFT JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            LEFT JOIN logistics.locations lo ON v.origin_id = lo.location_id
            LEFT JOIN logistics.locations ld ON v.destination_id = ld.location_id
            WHERE v.voyage_id = @voyageId";
        
        var voyage = await connection.QueryFirstOrDefaultAsync(voyageSql, new { voyageId });
        if (voyage == null) return;

        const string requestsSql = @"
            SELECT DISTINCT r.request_id, r.requested_by, r.notify, 
                   r.origin_id, r.destination_id, 
                   u.urgency_label as urgency
            FROM marine.movement_request_items i
            JOIN marine.movement_requests r ON i.request_id = r.request_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
            WHERE i.item_id = ANY(@itemIds)";
            
        var requests = await connection.QueryAsync(requestsSql, new { itemIds });

        foreach (var req in requests)
        {
            await ProcessAssignmentEmailAsync(req, voyage, smtpSettings);
        }
    }

    private async Task ProcessAssignmentEmailAsync(dynamic req, dynamic voyage, SmtpSettings smtpSettings)
    {
        var notify = (string?)req.notify;
        var notifyList = !string.IsNullOrEmpty(notify) 
            ? notify.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries).ToList() 
            : null;

        var recipients = ResolveRecipients((string?)req.requested_by, notifyList, smtpSettings);
        if (string.IsNullOrEmpty(recipients)) return;

        var template = await _notificationRepository.GetTemplateByIdAsync("voyage-assignment");
        var subject = template?.Subject ?? $"Klarity Notification: Items for Request {req.request_id} assigned to Voyage";
        var body = BuildAssignmentEmailBody(req, voyage, template?.BodyHtml);

        // Replace placeholders in subject if any
        subject = subject.Replace("{RequestId}", req.request_id);

        await _emailService.SendEmailAsync(recipients, subject, body);
    }

    private string BuildAssignmentEmailBody(dynamic req, dynamic voyage, string? templateHtml)
    {
        if (string.IsNullOrEmpty(templateHtml))
        {
            return $@"
                <h2>Items Assigned to Voyage</h2>
                <p>Items from your movement request <strong>{req.request_id}</strong> have been scheduled on a voyage.</p>
                <ul>
                    <li><strong>Vessel:</strong> {voyage.vessel_name}</li>
                    <li><strong>Voyage:</strong> {voyage.origin_name} to {voyage.destination_name}</li>
                    <li><strong>Departure:</strong> {((DateTime)voyage.departure_date_time).ToString("dd MMM yyyy HH:mm")}</li>
                    <li><strong>Urgency:</strong> {req.urgency}</li>
                </ul>
                <p>Please log in to Klarity for full details.</p>
            ";
        }

        return templateHtml
            .Replace("{RequestId}", req.request_id)
            .Replace("{VesselName}", (string)voyage.vessel_name)
            .Replace("{OriginName}", (string)voyage.origin_name)
            .Replace("{DestinationName}", (string)voyage.destination_name)
            .Replace("{DepartureTime}", ((DateTime)voyage.departure_date_time).ToString("dd MMM yyyy HH:mm"))
            .Replace("{Urgency}", (string)req.urgency);
    }

    public async Task SendManifestOnDepartureBackgroundTask(string voyageId)
    {
        _logger.LogInformation("SendManifestOnDepartureAsync started for {VoyageId}", voyageId);
        
        using var scope = _serviceScopeFactory.CreateScope();
        var pdfService = scope.ServiceProvider.GetRequiredService<Services.IPdfService>();
        var settingsRepo = scope.ServiceProvider.GetRequiredService<ISettingsRepository>();
        var emailService = scope.ServiceProvider.GetRequiredService<Services.IEmailService>();
        var notificationRepo = scope.ServiceProvider.GetRequiredService<INotificationRepository>();
        
        try 
        {
            var voyage = await GetVoyageByIdAsync(voyageId);
            if (voyage == null) 
            {
                _logger.LogWarning("Voyage {VoyageId} not found during notification", voyageId);
                return;
            }
            
            var requests = await GetVoyageManifestAsync(voyageId);
            if (!requests.Any()) 
            {
                _logger.LogInformation("No requests found for {VoyageId}, skipping notification", voyageId);
                return;
            }

            var template = await notificationRepo.GetTemplateByIdAsync("voyage-departure");

            _logger.LogInformation("Generating PDF for {VoyageId} with {Count} requests", voyageId, requests.Count());
            
            var pdfBytes = pdfService.GenerateVoyageManifestPdf(voyage, requests);
            
            var smtpSettings = await settingsRepo.GetSmtpSettingsAsync();
            if (!smtpSettings.Enabled) 
            {
                _logger.LogInformation("SMTP is disabled. Skipping email.");
                return;
            }

             var allItems = requests
                .SelectMany(r => r.Items.Select(i => new { Request = r, Item = i }))
                .Where(x => x.Item.AssignedVoyageId == voyageId)
                .ToList();
            
            var requesterGroups = allItems
                .GroupBy(x => x.Request.RequestedBy)
                .ToList();

            _logger.LogInformation("Found {Count} requester groups to email.", requesterGroups.Count);

            foreach (var group in requesterGroups)
            {
                await ProcessDepartureEmailAsync(group, voyage, smtpSettings, pdfBytes, emailService, template);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send manifest on departure");
        }
    }

    private async Task ProcessDepartureEmailAsync(
        IEnumerable<dynamic> group, 
        Voyage voyage, 
        SmtpSettings smtpSettings, 
        byte[] pdfBytes, 
        Services.IEmailService emailService,
        NotificationTemplate? template)
    {
        var firstItem = group.First();
        var requestedBy = (string)firstItem.Request.RequestedBy;
        if (string.IsNullOrEmpty(requestedBy)) return;

        var notifyEmails = group
            .SelectMany(x => (List<string>)x.Request.Notify ?? new List<string>())
            .Distinct()
            .ToList();

        var recipients = ResolveRecipients(requestedBy, notifyEmails, smtpSettings);
        if (string.IsNullOrEmpty(recipients)) return;

        _logger.LogInformation("Sending departure email to {Recipients}", recipients);

        var subject = template?.Subject ?? $"Voyage Departure Notification: {voyage.VesselName} - {voyage.VoyageId.ToUpper()}";
        subject = subject
            .Replace("{VesselName}", voyage.VesselName)
            .Replace("{VoyageId}", voyage.VoyageId.ToUpper());

        var itemsTableHtml = BuildItemsTableHtml(group);
        var body = BuildDepartureEmailBody(voyage, itemsTableHtml, template?.BodyHtml);

        var attachment = new System.Net.Mail.Attachment(new MemoryStream(pdfBytes), $"Manifest_{voyage.VesselName}.pdf", "application/pdf");
        await emailService.SendEmailWithAttachmentsAsync(recipients, subject, body, null, new List<System.Net.Mail.Attachment> { attachment });
    }

    private string BuildItemsTableHtml(IEnumerable<dynamic> items)
    {
        var html = @"
            <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 14px;'>
                <thead>
                    <tr style='background-color: #f2f2f2; text-align: left;'>
                        <th style='padding: 8px;'>Item</th>
                        <th style='padding: 8px;'>Quantity</th>
                        <th style='padding: 8px;'>Unit</th>
                        <th style='padding: 8px;'>Request ID</th>
                    </tr>
                </thead>
                <tbody>";

        foreach (var x in items)
        {
            html += $@"
                <tr>
                    <td style='padding: 8px;'>{x.Item.ItemTypeName ?? x.Item.Description}</td>
                    <td style='padding: 8px;'>{x.Item.Quantity}</td>
                    <td style='padding: 8px;'>{x.Item.UnitOfMeasurement}</td>
                    <td style='padding: 8px;'>{x.Request.RequestId}</td>
                </tr>";
        }

        html += "</tbody></table>";
        return html;
    }

    private string BuildDepartureEmailBody(Voyage voyage, string itemsTableHtml, string? templateHtml)
    {
        if (string.IsNullOrEmpty(templateHtml))
        {
            return $@"
                <h2>Voyage Departure Notification</h2>
                <p>The voyage <strong>{voyage.VoyageId.ToUpper()}</strong> has departed.</p>
                <p><strong>Vessel:</strong> {voyage.VesselName}</p>
                <p><strong>Route:</strong> {voyage.OriginName} to {voyage.DestinationName}</p>
                <p><strong>ETA:</strong> {voyage.Eta:dd MMM yyyy HH:mm}</p>
                <hr/>
                <h3>Your Scheduled Items:</h3>
                {itemsTableHtml}
                <p>The full voyage manifest is attached for your reference.</p>
            ";
        }

        return templateHtml
            .Replace("{VoyageId}", voyage.VoyageId.ToUpper())
            .Replace("{VesselName}", voyage.VesselName)
            .Replace("{OriginName}", voyage.OriginName)
            .Replace("{DestinationName}", voyage.DestinationName)
            .Replace("{Eta}", voyage.Eta.ToString("dd MMM yyyy HH:mm"))
            .Replace("{ItemsTable}", itemsTableHtml);
    }

    private string ResolveRecipients(string? requestedBy, List<string>? notify, SmtpSettings smtpSettings)
    {
        var toList = new List<string>();

        if (!string.IsNullOrEmpty(requestedBy))
        {
            var email = requestedBy;
            if (!email.Contains("@") && !string.IsNullOrEmpty(smtpSettings.Domain))
            {
                email = $"{email}@{smtpSettings.Domain}";
            }
            toList.Add(email);
        }

        if (notify != null && notify.Any())
        {
            var notifyEmails = notify
                .Where(e => !string.IsNullOrEmpty(e))
                .Select(e => e.Trim());
            toList.AddRange(notifyEmails);
        }

        return string.Join(";", toList.Where(e => !string.IsNullOrEmpty(e)).Distinct());
    }


}
