using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Klarity.Api.Models;

namespace Klarity.Api.Services;

public interface IPdfService
{
    byte[] GenerateVoyageManifestPdf(Voyage voyage, IEnumerable<MovementRequest> requests);
}

public class PdfService : IPdfService
{
    public PdfService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateVoyageManifestPdf(Voyage voyage, IEnumerable<MovementRequest> requests)
    {
        var allItems = requests
            .SelectMany(r => r.Items.Select(i => new { Request = r, Item = i }))
            .Where(x => x.Item.AssignedVoyageId == voyage.VoyageId)
            .ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(9).FontFamily("Helvetica"));

                page.Header().Element(ComposeHeader);
                page.Content().Element(ComposeContent);
                page.Footer().Element(ComposeFooter);
            });
        });

        void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("VOYAGE MANIFEST").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text($"Voyage ID: {voyage.VoyageId.ToUpper()}").FontSize(10).FontColor(Colors.Grey.Medium);
                });

                row.RelativeItem().Column(column =>
                {
                    column.Item().AlignRight().Text(text =>
                    {
                        text.Span("Generated: ").SemiBold();
                        text.Span($"{DateTime.Now:dd MMM yyyy HH:mm}");
                    });
                });
            });
        }

        void ComposeContent(IContainer container)
        {
            container.PaddingVertical(20).Column(column =>
            {
                column.Item().Element(ComposeVoyageDetails);
                column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                column.Item().Element(ComposeUtilization);
                column.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                column.Item().Element(ComposeTable);
            });
        }

        void ComposeVoyageDetails(IContainer container)
        {
             container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("VESSEL").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text(voyage.VesselName ?? "N/A").Bold();
                });
                
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("ROUTE").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.OriginName ?? voyage.OriginId} -> {voyage.DestinationName ?? voyage.DestinationId}").Bold();
                });

                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("DEPARTURE").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.DepartureDateTime:dd MMM yyyy HH:mm}");
                });

                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("EST. ARRIVAL").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.Eta:dd MMM yyyy HH:mm}");
                });
            });
        }

        void ComposeUtilization(IContainer container)
        {
             container.Row(row =>
            {
                row.ConstantItem(100).Column(column =>
                {
                    column.Item().Text("WEIGHT UTIL").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.WeightUtil:F1}%").Bold().FontColor(voyage.WeightUtil > 85 ? Colors.Red.Medium : Colors.Green.Medium);
                });
                
                row.ConstantItem(100).Column(column =>
                {
                    column.Item().Text("DECK UTIL").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.DeckUtil:F1}%").Bold().FontColor(voyage.DeckUtil > 85 ? Colors.Red.Medium : Colors.Green.Medium);
                });
                 row.ConstantItem(100).Column(column =>
                {
                    column.Item().Text("CABIN UTIL").FontSize(9).FontColor(Colors.Grey.Medium).Bold();
                    column.Item().Text($"{voyage.CabinUtil:F1}%").Bold().FontColor(voyage.CabinUtil > 85 ? Colors.Red.Medium : Colors.Green.Medium);
                });
            });
        }

        void ComposeTable(IContainer container)
        {
            container.Table(table =>
            {
                // Definition
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(80); // Req ID
                    columns.RelativeColumn(2); // Item Name
                    columns.RelativeColumn(); // Type/Cat
                    columns.RelativeColumn(1.5f); // Business Unit
                    columns.RelativeColumn(); // Qty
                    columns.RelativeColumn(); // Dimensions
                    columns.RelativeColumn(); // Weight
                    columns.RelativeColumn(); // Hazardous
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("REQ ID");
                    header.Cell().Element(HeaderStyle).Text("ITEM NAME");
                    header.Cell().Element(HeaderStyle).Text("CATEGORY");
                    header.Cell().Element(HeaderStyle).Text("BUSINESS UNIT");
                    header.Cell().Element(HeaderStyle).Text("QTY");
                    header.Cell().Element(HeaderStyle).Text("DIMENSIONS");
                    header.Cell().Element(HeaderStyle).Text("WEIGHT");
                    header.Cell().Element(HeaderStyle).Text("HAZARD");

                    static IContainer HeaderStyle(IContainer container)
                    {
                        return container.DefaultTextStyle(x => x.SemiBold()).BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                    }
                });

                // Content
                foreach (var x in allItems)
                {
                    var item = x.Item;
                    var req = x.Request;

                    table.Cell().Element(CellStyle).Text(req.RequestId.Length > 8 ? req.RequestId.Substring(0, 8).ToUpper() : req.RequestId);
                    table.Cell().Element(CellStyle).Text(item.ItemTypeName ?? item.Description ?? "N/A");
                    table.Cell().Element(CellStyle).Text(item.CategoryId);
                    table.Cell().Element(CellStyle).Text(req.BusinessUnitName ?? "N/A");
                    table.Cell().Element(CellStyle).Text($"{item.Quantity} {item.UnitOfMeasurement}");
                    table.Cell().Element(CellStyle).Text(item.Dimensions ?? "-");
                    table.Cell().Element(CellStyle).Text(item.Weight.HasValue ? $"{item.Weight.Value:F1} {item.WeightUnit ?? "t"}" : "-");
                    
                    if (item.IsHazardous)
                        table.Cell().Element(CellStyle).Text("YES").FontColor(Colors.Red.Medium).Bold();
                    else
                        table.Cell().Element(CellStyle).Text("-");

                    static IContainer CellStyle(IContainer container)
                    {
                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten3).PaddingVertical(5).PaddingRight(5);
                    }
                }
                
                if (!allItems.Any())
                {
                     // table.Cell().ColumnSpan(7).Element(c => c.PaddingVertical(10)).AlignCenter().Text("No items assigned.");
                }
            });
                
            if (!allItems.Any())
            {
                container.PaddingVertical(10).AlignCenter().Text("No items assigned to this voyage.").FontColor(Colors.Grey.Medium).Italic();
            }
        }

        void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
            {
                x.Span("Page ");
                x.CurrentPageNumber();
                x.Span(" of ");
                x.TotalPages();
            });
        }

        return document.GeneratePdf();
    }
}
