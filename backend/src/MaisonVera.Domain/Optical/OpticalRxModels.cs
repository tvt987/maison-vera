namespace MaisonVera.Domain.Optical;

public sealed record EyePrescription(
    double SphereD,
    double CylinderD,
    int? AxisDeg);

public sealed record OpticalRxSpec(
    EyePrescription Od,
    EyePrescription Os,
    double PdMm,
    double LensDiameterMm = 51.0,
    double BridgeWidthMm = 20.0,
    bool BlueLightFilterEnabled = true);

public sealed record RxValidationIssue(
    string Field,
    string Code,
    string Message);

public sealed record RxValidationResult(
    bool IsValid,
    IReadOnlyList<RxValidationIssue> Errors);

public sealed record EyeThicknessMetrics(
    double DominantPowerD,
    double SphericalEquivalentD,
    double SagittaMm,
    double CenterThicknessMm,
    double EdgeThicknessMm,
    double MaxThicknessMm,
    double WeightGrams);

public sealed record IndexComparisonMetrics(
    string IndexId,
    string IndexCode,
    string DisplayName,
    double RefractiveIndex,
    int AbbeValue,
    decimal SurchargeUsd,
    EyeThicknessMetrics Od,
    EyeThicknessMetrics Os,
    double PeakCenterThicknessMm,
    double PeakEdgeThicknessMm,
    double PeakThicknessMm,
    double EdgeReductionPercentVs150,
    double MaxThicknessReductionPercentVs150,
    double PairWeightGrams,
    bool Fits4mmTitaniumRim,
    bool IsRecommended);

public sealed record SpectralPoint(
    int WavelengthNm,
    double BaselineArTransmittancePct,
    double ActiveTransmittancePct);

public sealed record SpectralProfileSummary(
    string Profile,
    double Uv400BlockPercent,
    double HevBlueFilterPercent,
    double VisibleAvgTransmittancePercent,
    IReadOnlyList<SpectralPoint> Samples);

public sealed record OpticalRxAnalysis(
    double EffectiveSemiDiameterMm,
    double DecentrationPerEyeMm,
    double StrongestMeridianAbsD,
    string RecommendedIndexId,
    string RecommendedIndexCode,
    string RecommendedIndexLabel,
    decimal RecommendedUpgradeUsd,
    IReadOnlyList<IndexComparisonMetrics> Comparisons,
    SpectralProfileSummary Spectral);
