namespace MaisonVera.Domain.Optical;

public sealed record DecentrationGlareSpec(
    string EnvironmentId,
    string CoatingId,
    double AnalyzerAngleDeg,
    EyePrescription Od,
    EyePrescription Os,
    double PdMm,
    string? FrameSku = "MV-EYE-01");

public sealed record GlarePhysicsAnalysis(
    string EnvironmentId,
    string EnvironmentLabel,
    string SurfaceMedium,
    double RefractiveIndexN2,
    double BrewsterAngleDeg,
    int BaseGlareLuminanceCdM2,
    string CoatingId,
    string CoatingLabel,
    double AnalyzerAngleDeg,
    double MalusCosSquared,
    double VltPercent,
    double SurfaceReflectionPercent,
    double GlareAttenuationPercent,
    double ResidualGlareFraction,
    int ResidualGlareLuminanceCdM2,
    double ContrastAcuityGainDb,
    double BlueLightCutPercent,
    double Uv400BlockPercent,
    decimal CoatingSurchargeUsd,
    string ClinicalAdvisory);

public sealed record SabaeFrameDecentrationAnalysis(
    string Sku,
    string FrameName,
    double LensWidthMm,
    double BridgeWidthMm,
    double EffectiveDiameterMm,
    double FramePdMm,
    double PdMm,
    double DecentrationPerEyeMm,
    double AbsDecentrationMm,
    string DecentrationDirection,
    double OdHorizontalPowerD,
    double OsHorizontalPowerD,
    double PeakHorizontalPowerD,
    double OdPrismDiopters,
    double OsPrismDiopters,
    double PeakPrismDiopters,
    string PrismBaseDirection,
    bool WithinAnsiZ80Tolerance,
    double MinimumBlankSizeMm,
    int RecommendedStockBlankMm,
    bool FitsStandard70mmBlank,
    int OpticalFitScore,
    string Verdict,
    string VerdictLabel,
    string VerdictGuidance);

public sealed record DecentrationGlareAnalysis(
    GlarePhysicsAnalysis Glare,
    SabaeFrameDecentrationAnalysis SelectedFrame,
    string BestFrameSku,
    string BestFrameName,
    IReadOnlyList<SabaeFrameDecentrationAnalysis> AllFrames);

public sealed record DecentrationGlareValidationResult(
    bool IsValid,
    DecentrationGlareAnalysis? Analysis,
    IReadOnlyList<RxValidationIssue> Errors);
