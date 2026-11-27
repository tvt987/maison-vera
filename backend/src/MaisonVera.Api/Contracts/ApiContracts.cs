using MaisonVera.Domain.Optical;

namespace MaisonVera.Api.Contracts;

public sealed record EyePrescriptionDto(
    double SphereD,
    double CylinderD,
    int? AxisDeg);

public sealed record ValidateRxHttpRequest(
    EyePrescriptionDto Od,
    EyePrescriptionDto Os,
    double PdMm,
    double LensDiameterMm = 51.0,
    double BridgeWidthMm = 20.0,
    bool BlueLightFilterEnabled = true);

public sealed record ValidateRxHttpResponse(
    bool Valid,
    OpticalRxAnalysis Analysis);

public sealed record AtelierQuoteHttpRequest(
    string Sku,
    string? OpticalCoatingId = "clear-ar",
    string? RefractiveIndexId = null,
    string? EngravingTierId = "none",
    string? EngravingText = null,
    int Quantity = 1,
    ValidateRxHttpRequest? Prescription = null);

public sealed record ReserveFittingHttpRequest(
    string BoutiqueId,
    DateTimeOffset SlotStartUtc,
    string ClientName,
    string ClientEmail,
    string? PreferredSku = "MV-EYE-01",
    string? Notes = null,
    string? IdempotencyKey = null);

public sealed record DecentrationGlareHttpRequest(
    string EnvironmentId,
    string CoatingId,
    EyePrescriptionDto Od,
    EyePrescriptionDto Os,
    double PdMm = 64.0,
    double AnalyzerAngleDeg = 90.0,
    string? FrameSku = "MV-EYE-01");

public sealed record DecentrationGlareHttpResponse(
    bool Valid,
    DecentrationGlareAnalysis Analysis);
