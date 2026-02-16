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
    private readonly ILogger<VoyageRepository> _logger;

    public VoyageRepository(
        IDbConnectionFactory dbConnectionFactory,
        Services.IEmailService emailService,
        ISettingsRepository settingsRepository,
        Services.IPdfService pdfService,
        IServiceScopeFactory serviceScopeFactory,
        ILogger<VoyageRepository> logger)
    {
        _dbConnectionFactory = dbConnectionFactory;
        _emailService = emailService;
        _settingsRepository = settingsRepository;
        _pdfService = pdfService;
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    public async Task<IEnumerable<Voyage>> GetVoyagesAsync()
    {
        using var connection = _dbConnectionFactory.CreateConnection();
        const string sql = @"
            SELECT 
                v.voyage_id, v.vessel_id, v.origin_id, v.destination_id, 
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id,
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
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id,
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
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.is_deleted,
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
                v.departure_date_time, v.eta, v.weight_util, v.deck_util, v.cabin_util, v.status_id, v.is_deleted,
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
        if (string.IsNullOrEmpty(voyage.StatusId))
        {
            voyage.StatusId = "scheduled";
        }

        const string sql = @"
            INSERT INTO marine.voyages (
                voyage_id, vessel_id, origin_id, destination_id, 
                departure_date_time, eta, weight_util, deck_util, cabin_util, status_id, is_deleted
            ) VALUES (
                @VoyageId, @VesselId, @OriginId, @DestinationId, 
                @DepartureDateTime, @Eta, @WeightUtil, @DeckUtil, @CabinUtil, @StatusId, 0
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
        
        // Check voyage status first
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
            // Log error but don't fail the assignment
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
        using var connection = _dbConnectionFactory.CreateConnection();
        
        // 1. Get Voyage and Vessel capacity details
        const string voyageSql = @"
            SELECT v.vessel_id, ve.dead_weight, ve.deck_area, ve.total_complement
            FROM marine.voyages v
            JOIN marine.vessels ve ON v.vessel_id = ve.vessel_id
            WHERE v.voyage_id = @voyageId";
            
        var cap = await connection.QueryFirstOrDefaultAsync(voyageSql, new { voyageId });
        if (cap == null) return;

        // 2. Get all items assigned to this voyage
        const string itemsSql = @"
            SELECT category_id, quantity, unit_of_measurement, dimensions, dimension_unit, weight, weight_unit
            FROM marine.movement_request_items
            WHERE assigned_voyage_id = @voyageId";
            
        var items = await connection.QueryAsync(itemsSql, new { voyageId });

        double totalWeight = 0;
        double totalArea = 0;
        int personnelCount = 0;

        foreach (var item in items)
        {
            // Weight calculation (standardized to MT)
            double itemWeight = UnitConverter.ToMetricTonnes((double)(item.weight ?? 0), (string?)item.weight_unit);
            totalWeight += itemWeight;

            // Area calculation
            double unitArea = UnitConverter.ToSquareMeters((string?)item.dimensions, (string?)item.dimension_unit);
            totalArea += unitArea * (double)(item.quantity ?? 1);
        
            // Personnel calculation
            if ((string)item.category_id == "personnel")
            {
                personnelCount += (int)(double)item.quantity;
            }
        }

        // 3. Calculate percentages
        double deadWeight = (double)(cap.dead_weight ?? 1.0);
        double deckArea = (double)(cap.deck_area ?? 1.0);
        int totalComplement = (int)(cap.total_complement ?? 1);

        double weightUtil = Math.Round(Math.Min(100, (totalWeight / (deadWeight > 0 ? deadWeight : 1)) * 100), 1);
        double deckUtil = Math.Round(Math.Min(100, (totalArea / (deckArea > 0 ? deckArea : 1)) * 100), 1);
        double cabinUtil = Math.Round(Math.Min(100, ((double)personnelCount / (totalComplement > 0 ? totalComplement : 1)) * 100), 1);

        // 4. Update the voyage
        const string updateSql = @"
            UPDATE marine.voyages 
            SET weight_util = @weightUtil, deck_util = @deckUtil, cabin_util = @cabinUtil
            WHERE voyage_id = @voyageId";

        await connection.ExecuteAsync(updateSql, new { voyageId, weightUtil, deckUtil, cabinUtil });
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
                   r.business_unit as business_unit_id, r.cost_centre, r.comments, r.notify,
                   u.urgency_label as Urgency,
                   loc_o.location_name as OriginName, loc_d.location_name as DestinationName,
                   i.item_id, i.request_id, i.category_id, i.item_type_id, i.quantity, 
                   i.unit_of_measurement, i.description, i.dimensions, i.dimension_unit, 
                   i.volume, i.weight, i.weight_unit, i.assigned_voyage_id, i.status, i.is_hazardous,
                   it.type_name as ItemTypeName
            FROM marine.movement_requests r
            JOIN marine.movement_request_items i ON r.request_id = i.request_id
            LEFT JOIN logistics.item_types it ON i.item_type_id = it.type_id
            LEFT JOIN logistics.urgencies u ON r.urgency_id = u.urgency_id
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
        using var connection = _dbConnectionFactory.CreateConnection();
        
        // 1. Get SMTP settings to check domain
        var smtpSettings = await _settingsRepository.GetSmtpSettingsAsync();
        if (!smtpSettings.Enabled) return;

        // 2. Get Voyage details
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

        // 3. Get Request details (group items by request to send fewer emails)
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
            var requestedBy = (string)req.requested_by;
            var notify = (string)req.notify;
            
            // Construct To list
            var toList = new List<string>();
            
            // Add domain to requested_by if needed
            if (!string.IsNullOrEmpty(requestedBy))
            {
                if (!requestedBy.Contains("@") && !string.IsNullOrEmpty(smtpSettings.Domain))
                {
                    requestedBy = $"{requestedBy}@{smtpSettings.Domain}";
                }
                toList.Add(requestedBy);
            }

            // Parse notify field (assuming comma or semicolon separated emails)
            if (!string.IsNullOrEmpty(notify))
            {
                var notifyEmails = notify.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries)
                                         .Select(e => e.Trim())
                                         .Where(e => !string.IsNullOrEmpty(e));
                toList.AddRange(notifyEmails);
            }

            if (!toList.Any()) continue;

            var recipients = string.Join(";", toList.Distinct());
            var subject = $"Klarity Notification: Items for Request {req.request_id} assigned to Voyage";
            
            var body = $@"
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

            await _emailService.SendEmailAsync(recipients, subject, body);
        }
    }

    public async Task SendManifestOnDepartureBackgroundTask(string voyageId)
    {
        _logger.LogInformation("SendManifestOnDepartureAsync started for {VoyageId}", voyageId);
        
        using var scope = _serviceScopeFactory.CreateScope();
        var pdfService = scope.ServiceProvider.GetRequiredService<Services.IPdfService>();
        var settingsRepo = scope.ServiceProvider.GetRequiredService<ISettingsRepository>();
        var emailService = scope.ServiceProvider.GetRequiredService<Services.IEmailService>();
        
        try 
        {
            // 1. Get Full Voyage Details
            // Note: We are calling 'this.GetVoyageByIdAsync' which uses _dbConnectionFactory.
            // _dbConnectionFactory is Singleton, so it's safe to use from the background thread.
            var voyage = await GetVoyageByIdAsync(voyageId);
            if (voyage == null) 
            {
                _logger.LogWarning("Voyage {VoyageId} not found during notification", voyageId);
                return;
            }
            
            // 2. Get Manifest Items
            var requests = await GetVoyageManifestAsync(voyageId);
            if (!requests.Any()) 
            {
                _logger.LogInformation("No requests found for {VoyageId}, skipping notification", voyageId);
                return;
            }

            _logger.LogInformation("Generating PDF for {VoyageId} with {Count} requests", voyageId, requests.Count());
            
            // 3. Generate PDF (Using scoped service)
            var pdfBytes = pdfService.GenerateVoyageManifestPdf(voyage, requests);
            
            // 4. Get SMTP settings (Using scoped repo)
            var smtpSettings = await settingsRepo.GetSmtpSettingsAsync();
            if (!smtpSettings.Enabled) 
            {
                _logger.LogInformation("SMTP is disabled. Skipping email.");
                return;
            }

             // 5. Group items by Requester to send targeted emails
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
                var requestedBy = group.Key; 
                if (string.IsNullOrEmpty(requestedBy)) continue;

                var notifyEmails = group
                    .SelectMany(x => x.Request.Notify ?? new List<string>())
                    .Distinct()
                    .ToList();
                
                var toList = new List<string>();
                 if (!requestedBy.Contains("@") && !string.IsNullOrEmpty(smtpSettings.Domain))
                {
                    toList.Add($"{requestedBy}@{smtpSettings.Domain}");
                }
                else
                {
                     toList.Add(requestedBy);
                }
                toList.AddRange(notifyEmails);
                
                if (!toList.Any()) continue;

                var recipients = string.Join(";", toList.Distinct());
                _logger.LogInformation("Sending email to {Recipients}", recipients);

                var subject = $"Voyage Departure Notification: {voyage.VesselName} - {voyage.VoyageId.ToUpper()}";
                
                var itemsTableHtml = @"
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

                foreach(var x in group)
                {
                    itemsTableHtml += $@"
                        <tr>
                            <td style='padding: 8px;'>{x.Item.ItemTypeName ?? x.Item.Description}</td>
                            <td style='padding: 8px;'>{x.Item.Quantity}</td>
                            <td style='padding: 8px;'>{x.Item.UnitOfMeasurement}</td>
                            <td style='padding: 8px;'>{x.Request.RequestId}</td>
                        </tr>";
                }
                itemsTableHtml += "</tbody></table>";

                var body = $@"
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
                
                var attachmentForEmail = new System.Net.Mail.Attachment(new MemoryStream(pdfBytes), $"Manifest_{voyage.VesselName}.pdf", "application/pdf");
                
                // Using scoped email service
                await emailService.SendEmailWithAttachmentsAsync(recipients, subject, body, null, new List<System.Net.Mail.Attachment> { attachmentForEmail });
                _logger.LogInformation("Email sent successfully to {Recipients}", recipients);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send manifest on departure");
        }
    }

}
