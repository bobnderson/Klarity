using System;
using System.IO;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;
using Klarity.Api.Models;
using iText.Html2pdf;
using iText.Kernel.Events;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas;
using iText.Layout;
using iText.Layout.Element;
using iText.IO.Font.Constants;
using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Colors;
using iText.Layout.Properties;

namespace Klarity.Api.Services
{
    public class ManifestExportData
    {
        public string Identifier { get; set; } = string.Empty;
        public string VesselName { get; set; } = string.Empty;
        public string Route { get; set; } = string.Empty;
        public string Departure { get; set; } = string.Empty;
        public string Arrival { get; set; } = string.Empty;
        public double WeightUtil { get; set; }
        public double DeckUtil { get; set; }
        public IEnumerable<MovementRequest> Manifest { get; set; } = new List<MovementRequest>();
        public bool IsAviation { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public interface IManifestExportService
    {
        byte[] GenerateManifestPdf(ManifestExportData data);
    }

    public class DraftWatermarkHandler : IEventHandler
    {
        public void HandleEvent(Event @event)
        {
            PdfDocumentEvent docEvent = (PdfDocumentEvent)@event;
            PdfDocument pdf = docEvent.GetDocument();
            PdfPage page = docEvent.GetPage();
            Rectangle pageSize = page.GetPageSize();

            PdfCanvas canvas = new PdfCanvas(page.NewContentStreamAfter(), page.GetResources(), pdf);
            Canvas layoutCanvas = new Canvas(canvas, pageSize);

            PdfFont font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);

            Paragraph watermark = new Paragraph("DRAFT")
                .SetFont(font)
                .SetFontSize(150)
                .SetFontColor(ColorConstants.RED)
                .SetOpacity(0.08f);

            layoutCanvas.ShowTextAligned(
                watermark,
                pageSize.GetWidth() / 2,
                pageSize.GetHeight() / 2,
                pdf.GetPageNumber(page),
                TextAlignment.CENTER,
                VerticalAlignment.MIDDLE,
                45
            );

            layoutCanvas.Close();
        }
    }

    public class ManifestExportService : IManifestExportService
    {
        private readonly ILogger<ManifestExportService> _logger;
        private readonly IConfiguration _configuration;

        public ManifestExportService(ILogger<ManifestExportService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public byte[] GenerateManifestPdf(ManifestExportData data)
        {
            try
            {
                var htmlContent = GenerateManifestHtml(data);
                
                using (var memoryStream = new MemoryStream())
                {
                    var writer = new PdfWriter(memoryStream);
                    var pdf = new PdfDocument(writer);
                    
                    var isDraft = string.IsNullOrEmpty(data.Status) || 
                                   !(data.Status.Equals("Enroute", StringComparison.OrdinalIgnoreCase) || 
                                     data.Status.Equals("Arrived", StringComparison.OrdinalIgnoreCase));
                                     
                    if (isDraft)
                    {
                        pdf.AddEventHandler(PdfDocumentEvent.START_PAGE, new DraftWatermarkHandler());
                    }

                    var properties = new ConverterProperties();
                    HtmlConverter.ConvertToPdf(htmlContent, pdf, properties);
                    return memoryStream.ToArray();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating manifest PDF for {Identifier}", data.Identifier);
                throw;
            }
        }

        private string GenerateManifestHtml(ManifestExportData data)
        {
            var headerType = data.IsAviation ? "FLIGHT" : "VOYAGE";
            var vesselLabel = data.IsAviation ? "AIRCRAFT" : "VESSEL";
            var utilLabel1 = data.IsAviation ? "Weight util:" : "Payload util:";
            var utilLabel2 = data.IsAviation ? "Cabin util:" : "Deck util:";

            string rows = "";
            foreach (var req in data.Manifest)
            {
                foreach (var item in req.Items)
                {
                    string reqId = req.RequestId.ToUpper();
                    string haz = item.IsHazardous ? "YES" : "-";
                    string weightStr = item.Weight.HasValue ? $"{item.Weight.Value} t" : "-";
                    string dimStr = string.IsNullOrEmpty(item.Dimensions) ? "-" : item.Dimensions;
                    string urgency = string.IsNullOrEmpty(req.Urgency) ? "Routine" : req.Urgency;
                    string desc = string.IsNullOrEmpty(item.Description) ? "-" : item.Description;

                    rows += $@"
                        <tr>
                            <td>{reqId}</td>
                            <td>{req.BusinessUnitName ?? "-"}</td>
                            <td>{item.CategoryId}</td>
                            <td>{item.ItemTypeId}</td>
                            <td>{desc}</td>
                            <td>{haz}</td>
                            <td>{item.Quantity}</td>
                            <td>{dimStr}</td>
                            <td>{weightStr}</td>
                            <td>{urgency}</td>
                        </tr>";
                }
            }

            var templatePath = System.IO.Path.Combine(AppContext.BaseDirectory, "Templates", "ManifestTemplate.html");
            if (!System.IO.File.Exists(templatePath))
            {
                _logger.LogError("Manifest template missing at {Path}", templatePath);
                throw new FileNotFoundException($"Template not found at {templatePath}");
            }
            
            var html = System.IO.File.ReadAllText(templatePath);

            var clientName = _configuration["Manifest:ClientName"] ?? "Shell Nigeria Exploration and Production Co. Ltd.";

            html = html.Replace("{{HeaderType}}", headerType)
                       .Replace("{{Identifier}}", data.Identifier)
                       .Replace("{{DateTime}}", DateTime.Now.ToString("dd MMM yyyy HH:mm"))
                       .Replace("{{VesselLabel}}", vesselLabel)
                       .Replace("{{VesselName}}", data.VesselName)
                       .Replace("{{ClientName}}", clientName)
                       .Replace("{{Route}}", data.Route)
                       .Replace("{{Departure}}", data.Departure)
                       .Replace("{{Arrival}}", data.Arrival)
                       .Replace("{{UtilLabel1}}", utilLabel1)
                       .Replace("{{WeightUtil}}", data.WeightUtil.ToString("0.0"))
                       .Replace("{{UtilLabel2}}", utilLabel2)
                       .Replace("{{DeckUtil}}", data.DeckUtil.ToString("0.0"))
                       .Replace("{{Rows}}", rows);

            return html;
        }
    }
}
