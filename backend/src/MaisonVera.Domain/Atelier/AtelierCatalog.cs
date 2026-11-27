using System.Text.RegularExpressions;
using MaisonVera.Domain.Optical;

namespace MaisonVera.Domain.Atelier;

public sealed record FrameSkuSpec(
    string Sku,
    string ProductId,
    string Name,
    decimal BasePriceUsd,
    double DefaultLensDiameterMm,
    double DefaultBridgeWidthMm);

public sealed record OpticalCoatingSpec(
    string Id,
    string DisplayName,
    decimal SurchargeUsd);

public sealed record EngravingTierSpec(
    string Id,
    string DisplayName,
    decimal SurchargeUsd);

public static partial class AtelierCatalog
{
    public const decimal UsdToVndRate = 25450m;
    public const decimal VipDepositRatio = 0.30m;

    public static readonly IReadOnlyList<FrameSkuSpec> Frames =
    [
        new("MV-EYE-01", "mv-eye-01", "VÉRA-01 Monolith Titanium Frame", 480m, 51.0, 20.0),
        new("MV-EYE-02", "mv-eye-02", "Solaire Sculpted Bridge Shield", 420m, 54.0, 19.0),
        new("MV-EYE-03", "mv-eye-03", "Archival Acetate Optical 04", 360m, 48.0, 21.0)
    ];

    public static readonly IReadOnlyList<OpticalCoatingSpec> Coatings =
    [
        new("clear-ar", "Clear Anti-Reflective (Zeiss DuraVision)", 0m),
        new("blue-light-studio", "Blue-Light Studio Filter (UV400 + HEV 415–455nm)", 65m),
        new("polarized-amber", "Polarized Amber Drive (99.4% Glare Cut)", 85m),
        new("midnight-gradient", "Midnight Gradient Nocturne", 95m),
        new("photochromic-uv", "Photochromic UV Sunlight Transition", 110m)
    ];

    public static readonly IReadOnlyList<EngravingTierSpec> EngravingTiers =
    [
        new("none", "No Temple Engraving", 0m),
        new("micro-laser", "Inner Temple Micro-Laser (0.12mm)", 45m),
        new("gold-18k-inlay", "18K Champagne Gold Inlay Signature", 95m)
    ];

    public static FrameSkuSpec? FindFrame(string? skuOrId)
    {
        if (string.IsNullOrWhiteSpace(skuOrId)) return null;
        var norm = skuOrId.Trim();
        return Frames.FirstOrDefault(f =>
            f.Sku.Equals(norm, StringComparison.OrdinalIgnoreCase) ||
            f.ProductId.Equals(norm, StringComparison.OrdinalIgnoreCase));
    }

    public static OpticalCoatingSpec? FindCoating(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        return Coatings.FirstOrDefault(c => c.Id.Equals(id.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    public static EngravingTierSpec? FindEngraving(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        return EngravingTiers.FirstOrDefault(e => e.Id.Equals(id.Trim(), StringComparison.OrdinalIgnoreCase));
    }

    [GeneratedRegex("[^A-Z0-9.\\- ]", RegexOptions.Compiled)]
    private static partial Regex InvalidEngravingCharsRegex();

    public static string SanitizeEngravingText(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var cleaned = InvalidEngravingCharsRegex().Replace(raw.ToUpperInvariant(), string.Empty).Trim();
        return cleaned.Length <= 12 ? cleaned : cleaned[..12];
    }

    public static AtelierQuoteResult CalculateQuote(AtelierQuoteRequest request)
    {
        var errors = new List<string>();

        var frame = FindFrame(request.Sku);
        if (frame is null)
        {
            errors.Add($"Unknown eyewear SKU '{request.Sku}'. Supported SKUs: MV-EYE-01, MV-EYE-02, MV-EYE-03.");
        }

        var coatingId = string.IsNullOrWhiteSpace(request.OpticalCoatingId) ? "clear-ar" : request.OpticalCoatingId;
        var coating = FindCoating(coatingId);
        if (coating is null)
        {
            errors.Add($"Unknown optical coating '{coatingId}'.");
        }

        var engravingId = string.IsNullOrWhiteSpace(request.EngravingTierId) ? "none" : request.EngravingTierId;
        var engraving = FindEngraving(engravingId);
        if (engraving is null)
        {
            errors.Add($"Unknown engraving tier '{engravingId}'.");
        }

        var quantity = request.Quantity <= 0 ? 1 : request.Quantity;
        if (quantity > 10)
        {
            errors.Add("Atelier bespoke commission quantity cannot exceed 10 units per order.");
        }

        RefractiveIndexSpec? chosenIndex = null;
        OpticalRxAnalysis? rxAnalysis = null;

        if (request.Prescription is not null)
        {
            var rxSpec = request.Prescription with
            {
                LensDiameterMm = request.Prescription.LensDiameterMm <= 0 && frame is not null
                    ? frame.DefaultLensDiameterMm
                    : request.Prescription.LensDiameterMm,
                BridgeWidthMm = request.Prescription.BridgeWidthMm <= 0 && frame is not null
                    ? frame.DefaultBridgeWidthMm
                    : request.Prescription.BridgeWidthMm
            };
            var rxValidation = OpticalRxValidator.Validate(rxSpec);
            if (!rxValidation.IsValid)
            {
                errors.AddRange(rxValidation.Errors.Select(e => $"{e.Field}: {e.Message}"));
            }
            else
            {
                rxAnalysis = SagittaOpticalCalculator.Analyze(rxSpec);
                chosenIndex = string.IsNullOrWhiteSpace(request.RefractiveIndexId)
                    ? RefractiveIndexCatalog.FindByIdOrCode(rxAnalysis.RecommendedIndexId)
                    : RefractiveIndexCatalog.FindByIdOrCode(request.RefractiveIndexId);
                if (chosenIndex is null)
                {
                    errors.Add($"Unknown refractive index '{request.RefractiveIndexId}'. Supported: 1.50, 1.59, 1.67, 1.74.");
                }
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.RefractiveIndexId))
        {
            chosenIndex = RefractiveIndexCatalog.FindByIdOrCode(request.RefractiveIndexId);
            if (chosenIndex is null)
            {
                errors.Add($"Unknown refractive index '{request.RefractiveIndexId}'. Supported: 1.50, 1.59, 1.67, 1.74.");
            }
        }
        else
        {
            chosenIndex = RefractiveIndexCatalog.All[0];
        }

        if (errors.Count > 0)
        {
            return new AtelierQuoteResult(false, null, errors);
        }

        var sanitizedEngraving = engraving!.Id == "none"
            ? string.Empty
            : SanitizeEngravingText(request.EngravingText);

        var baseFrameUsd = frame!.BasePriceUsd;
        var coatingUsd = coating!.SurchargeUsd;
        var indexUsd = chosenIndex!.SurchargeUsd;
        var engravingUsd = engraving.SurchargeUsd;
        var unitTotalUsd = baseFrameUsd + coatingUsd + indexUsd + engravingUsd;
        var grandTotalUsd = unitTotalUsd * quantity;
        var grandTotalVnd = Math.Round(grandTotalUsd * UsdToVndRate / 1000m, MidpointRounding.AwayFromZero) * 1000m;
        var vipDepositVnd = Math.Round(grandTotalVnd * VipDepositRatio / 1000m, MidpointRounding.AwayFromZero) * 1000m;

        var quote = new AtelierQuoteBreakdown(
            QuoteId: $"MVQ-{frame.Sku[^2..]}-{Math.Abs(HashCode.Combine(frame.Sku, coating.Id, chosenIndex.Id, engraving.Id, sanitizedEngraving, quantity)) % 90000 + 10000}",
            Sku: frame.Sku,
            FrameName: frame.Name,
            Quantity: quantity,
            OpticalCoatingId: coating.Id,
            OpticalCoatingLabel: coating.DisplayName,
            RefractiveIndexId: chosenIndex.Id,
            RefractiveIndexCode: chosenIndex.Code,
            EngravingTierId: engraving.Id,
            SanitizedEngravingText: sanitizedEngraving,
            BaseFrameUsd: baseFrameUsd,
            OpticalCoatingUsd: coatingUsd,
            RefractiveIndexUsd: indexUsd,
            EngravingUsd: engravingUsd,
            UnitTotalUsd: unitTotalUsd,
            GrandTotalUsd: grandTotalUsd,
            GrandTotalVnd: grandTotalVnd,
            VipDeposit30PercentVnd: vipDepositVnd,
            RxAnalysis: rxAnalysis);

        return new AtelierQuoteResult(true, quote, []);
    }
}

public sealed record AtelierQuoteRequest(
    string Sku,
    string? OpticalCoatingId = "clear-ar",
    string? RefractiveIndexId = null,
    string? EngravingTierId = "none",
    string? EngravingText = null,
    int Quantity = 1,
    OpticalRxSpec? Prescription = null);

public sealed record AtelierQuoteBreakdown(
    string QuoteId,
    string Sku,
    string FrameName,
    int Quantity,
    string OpticalCoatingId,
    string OpticalCoatingLabel,
    string RefractiveIndexId,
    string RefractiveIndexCode,
    string EngravingTierId,
    string SanitizedEngravingText,
    decimal BaseFrameUsd,
    decimal OpticalCoatingUsd,
    decimal RefractiveIndexUsd,
    decimal EngravingUsd,
    decimal UnitTotalUsd,
    decimal GrandTotalUsd,
    decimal GrandTotalVnd,
    decimal VipDeposit30PercentVnd,
    OpticalRxAnalysis? RxAnalysis);

public sealed record AtelierQuoteResult(
    bool IsValid,
    AtelierQuoteBreakdown? Quote,
    IReadOnlyList<string> Errors);
