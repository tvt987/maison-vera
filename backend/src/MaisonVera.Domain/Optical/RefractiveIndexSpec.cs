namespace MaisonVera.Domain.Optical;

public sealed record RefractiveIndexSpec(
    string Id,
    string Code,
    double RefractiveIndex,
    int AbbeValue,
    double DensityGcm3,
    double MinCenterThicknessMm,
    double MinEdgeThicknessMm,
    double AsphericFactor,
    decimal SurchargeUsd,
    string DisplayName,
    string MaterialOrigin);

public static class RefractiveIndexCatalog
{
    public const double TitaniumRimDepthMm = 4.0;
    public const decimal BlueLightStudioSurchargeUsd = 65m;

    public static readonly IReadOnlyList<RefractiveIndexSpec> All =
    [
        new(
            Id: "cr39-150",
            Code: "1.50",
            RefractiveIndex: 1.50,
            AbbeValue: 58,
            DensityGcm3: 1.32,
            MinCenterThicknessMm: 2.0,
            MinEdgeThicknessMm: 1.2,
            AsphericFactor: 1.00,
            SurchargeUsd: 0m,
            DisplayName: "CR-39 Standard 1.50",
            MaterialOrigin: "Mineral-grade Columbia Resin — Highest Abbe 58 optical clarity"),
        new(
            Id: "poly-159",
            Code: "1.59",
            RefractiveIndex: 1.59,
            AbbeValue: 30,
            DensityGcm3: 1.20,
            MinCenterThicknessMm: 1.5,
            MinEdgeThicknessMm: 1.0,
            AsphericFactor: 0.97,
            SurchargeUsd: 75m,
            DisplayName: "Polycarbonate 1.59",
            MaterialOrigin: "Featherweight impact-resistant aerospace polycarbonate"),
        new(
            Id: "high-167",
            Code: "1.67",
            RefractiveIndex: 1.67,
            AbbeValue: 32,
            DensityGcm3: 1.35,
            MinCenterThicknessMm: 1.3,
            MinEdgeThicknessMm: 0.9,
            AsphericFactor: 0.93,
            SurchargeUsd: 140m,
            DisplayName: "High-Index 1.67 Aspheric",
            MaterialOrigin: "Japanese MR-7 high-index monomer — Single-side aspheric profile"),
        new(
            Id: "ultra-174",
            Code: "1.74",
            RefractiveIndex: 1.74,
            AbbeValue: 33,
            DensityGcm3: 1.47,
            MinCenterThicknessMm: 1.1,
            MinEdgeThicknessMm: 0.8,
            AsphericFactor: 0.88,
            SurchargeUsd: 240m,
            DisplayName: "Ultra-Thin 1.74 Japanese Aspheric",
            MaterialOrigin: "Sabae double-aspheric MR-174 — Engineered flush for 4mm titanium rims")
    ];

    public static RefractiveIndexSpec? FindByIdOrCode(string? idOrCode)
    {
        if (string.IsNullOrWhiteSpace(idOrCode))
        {
            return null;
        }

        var normalized = idOrCode.Trim();
        return All.FirstOrDefault(s =>
            s.Id.Equals(normalized, StringComparison.OrdinalIgnoreCase) ||
            s.Code.Equals(normalized, StringComparison.OrdinalIgnoreCase));
    }

    public static RefractiveIndexSpec RecommendForPower(double strongestAbsMeridianD)
    {
        if (strongestAbsMeridianD <= 2.0 + 1e-6) return All[0];
        if (strongestAbsMeridianD <= 3.75 + 1e-6) return All[1];
        if (strongestAbsMeridianD <= 5.5 + 1e-6) return All[2];
        return All[3];
    }
}
