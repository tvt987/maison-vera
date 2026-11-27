namespace MaisonVera.Domain.Optical;

public static class DecentrationGlareCalculator
{
    public const double UncoatedGlareAttenuationPercent = 12.0;
    public const double AnsiZ80HorizontalPrismLimitDelta = 0.67;
    public const double StandardStockBlankMm = 70.0;
    public const double EdgingAllowanceMm = 2.0;

    private sealed record GlareEnvDef(
        string Id,
        string Label,
        string SurfaceMedium,
        double RefractiveIndexN2,
        int BaseGlareLuminanceCdM2,
        double ArAttenuationPercent,
        double PolarizedPeakAttenuationPercent,
        double PolarizedParallelAttenuationPercent);

    private sealed record CoatingDef(
        string Id,
        string Label,
        double VltPercent,
        double SurfaceReflectionPercent,
        double BlueLightCutPercent,
        double Uv400BlockPercent,
        decimal SurchargeUsd);

    private sealed record SabaeFrameDef(
        string Sku,
        string Name,
        double LensWidthMm,
        double BridgeWidthMm,
        double EffectiveDiameterMm);

    private static readonly IReadOnlyList<GlareEnvDef> Environments =
    [
        new("mediterranean-ocean", "Mediterranean Ocean Sun", "Seawater Surface (n = 1.333)", 1.333, 88000, 48.5, 99.4, 42.0),
        new("rain-night-highway", "Rain-Slicked Night Highway", "Wet Asphalt Film (n = 1.360)", 1.360, 24000, 64.2, 96.2, 38.0),
        new("alpine-snow", "High-Altitude Alpine Snow", "Compacted Ice Crust (n = 1.310)", 1.310, 112000, 44.0, 98.9, 45.0)
    ];

    private static readonly IReadOnlyList<CoatingDef> Coatings =
    [
        new("uncoated-cr39", "Uncoated CR-39", 92.0, 7.8, 8.0, 91.5, 0m),
        new("hydrophobic-ar", "Multi-Layer Hydrophobic AR", 98.8, 0.4, 18.0, 99.6, 65m),
        new("polarized-blue-ar", "Polarized Optical Filter + Blue-Light AR", 24.0, 0.4, 78.0, 99.9, 85m)
    ];

    private static readonly IReadOnlyList<SabaeFrameDef> SabaeFrames =
    [
        new("MV-EYE-04", "Panto 46 Sabae Titanium", 46.0, 21.0, 48.0),
        new("MV-EYE-03", "Archival Optical 04 (48 mm)", 48.0, 21.0, 50.0),
        new("MV-EYE-01", "VÉRA-01 Monolith (51 mm)", 51.0, 20.0, 53.0),
        new("MV-EYE-02", "Solaire 54 Aviator Shield", 54.0, 19.0, 58.0)
    ];

    public static double ComputeBrewsterAngleDeg(double n2, double n1 = 1.0) =>
        Round1(Math.Atan(n2 / n1) * 180.0 / Math.PI);

    public static double ComputeHorizontalMeridianPowerD(EyePrescription eye)
    {
        if (Math.Abs(eye.CylinderD) < 1e-6)
        {
            return Round2(eye.SphereD);
        }

        var axisDeg = eye.AxisDeg ?? 90;
        var sinAxis = Math.Sin(axisDeg * Math.PI / 180.0);
        return Round2(eye.SphereD + eye.CylinderD * sinAxis * sinAxis);
    }

    public static double ComputePerEyeDecentrationMm(double lensWidthMm, double bridgeWidthMm, double pdMm) =>
        Round2((lensWidthMm + bridgeWidthMm - pdMm) / 2.0);

    public static double ComputePrenticePrismDiopters(double decentrationMm, double horizontalPowerD) =>
        Round2(Math.Abs(decentrationMm) / 10.0 * Math.Abs(horizontalPowerD));

    public static double ComputeMinimumBlankSizeMm(double effectiveDiameterMm, double decentrationMm) =>
        Round1(effectiveDiameterMm + 2.0 * Math.Abs(decentrationMm) + EdgingAllowanceMm);

    public static DecentrationGlareValidationResult Analyze(DecentrationGlareSpec spec)
    {
        var errors = new List<RxValidationIssue>();

        var env = Environments.FirstOrDefault(e =>
            e.Id.Equals(spec.EnvironmentId?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (env is null)
        {
            errors.Add(new RxValidationIssue(
                "environmentId",
                "ENVIRONMENT_INVALID",
                $"Unsupported lighting environment '{spec.EnvironmentId}'. Supported: mediterranean-ocean, rain-night-highway, alpine-snow."));
        }

        var coating = Coatings.FirstOrDefault(c =>
            c.Id.Equals(spec.CoatingId?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (coating is null)
        {
            errors.Add(new RxValidationIssue(
                "coatingId",
                "COATING_INVALID",
                $"Unsupported optical coating '{spec.CoatingId}'. Supported: uncoated-cr39, hydrophobic-ar, polarized-blue-ar."));
        }

        if (!double.IsFinite(spec.AnalyzerAngleDeg) || spec.AnalyzerAngleDeg < 0.0 || spec.AnalyzerAngleDeg > 90.0)
        {
            errors.Add(new RxValidationIssue(
                "analyzerAngleDeg",
                "ANALYZER_ANGLE_OUT_OF_RANGE",
                "Malus law analyzer angle must be between 0° and 90°."));
        }

        var frameSkuKey = string.IsNullOrWhiteSpace(spec.FrameSku) ? "MV-EYE-01" : spec.FrameSku.Trim();
        var targetFrame = SabaeFrames.FirstOrDefault(f =>
            f.Sku.Equals(frameSkuKey, StringComparison.OrdinalIgnoreCase));
        if (targetFrame is null)
        {
            errors.Add(new RxValidationIssue(
                "frameSku",
                "FRAME_SKU_UNKNOWN",
                $"Unknown Sabae frame SKU '{spec.FrameSku}'. Supported: MV-EYE-04, MV-EYE-03, MV-EYE-01, MV-EYE-02."));
        }

        var rxValidation = OpticalRxValidator.Validate(new OpticalRxSpec(
            Od: spec.Od,
            Os: spec.Os,
            PdMm: spec.PdMm,
            LensDiameterMm: targetFrame?.LensWidthMm ?? 51.0,
            BridgeWidthMm: targetFrame?.BridgeWidthMm ?? 20.0));
        if (!rxValidation.IsValid)
        {
            errors.AddRange(rxValidation.Errors);
        }

        if (errors.Count > 0)
        {
            return new DecentrationGlareValidationResult(false, null, errors);
        }

        var glare = ComputeGlarePhysics(env!, coating!, spec.AnalyzerAngleDeg);
        var allFrames = SabaeFrames
            .Select(f => EvaluateFrame(f, spec.PdMm, spec.Od, spec.Os))
            .ToList();

        var selectedFrame = allFrames.First(f =>
            f.Sku.Equals(targetFrame!.Sku, StringComparison.OrdinalIgnoreCase));

        var bestFrame = allFrames
            .OrderByDescending(f => f.OpticalFitScore)
            .ThenBy(f => f.AbsDecentrationMm)
            .First();

        var analysis = new DecentrationGlareAnalysis(
            Glare: glare,
            SelectedFrame: selectedFrame,
            BestFrameSku: bestFrame.Sku,
            BestFrameName: bestFrame.FrameName,
            AllFrames: allFrames);

        return new DecentrationGlareValidationResult(true, analysis, []);
    }

    private static GlarePhysicsAnalysis ComputeGlarePhysics(
        GlareEnvDef env,
        CoatingDef coating,
        double rawAngleDeg)
    {
        var angleDeg = Round1(Math.Clamp(rawAngleDeg, 0.0, 90.0));
        var thetaRad = angleDeg * Math.PI / 180.0;
        var cosTheta = Math.Cos(thetaRad);
        var malusCosSquared = Round3(cosTheta * cosTheta);
        var brewsterAngleDeg = ComputeBrewsterAngleDeg(env.RefractiveIndexN2);

        double glareAttenuationPct;
        if (coating.Id == "uncoated-cr39")
        {
            glareAttenuationPct = UncoatedGlareAttenuationPercent;
        }
        else if (coating.Id == "hydrophobic-ar")
        {
            glareAttenuationPct = env.ArAttenuationPercent;
        }
        else
        {
            var rMin = 1.0 - env.PolarizedPeakAttenuationPercent / 100.0;
            var rMax = 1.0 - env.PolarizedParallelAttenuationPercent / 100.0;
            var residual = rMin + (rMax - rMin) * (cosTheta * cosTheta);
            glareAttenuationPct = Round1((1.0 - residual) * 100.0);
        }

        var residualFraction = Round3(Math.Max(0.001, 1.0 - glareAttenuationPct / 100.0));
        var residualLuminance = (int)Math.Round(env.BaseGlareLuminanceCdM2 * residualFraction, MidpointRounding.AwayFromZero);

        var baselineVeiling = (1.0 - UncoatedGlareAttenuationPercent / 100.0) + (7.8 / 100.0) * 1.6 + 0.012;
        var activeVeiling = residualFraction + (coating.SurfaceReflectionPercent / 100.0) * 1.6 + 0.012;
        var contrastGainDb = coating.Id == "uncoated-cr39"
            ? 0.0
            : Round1(Math.Max(0.0, 10.0 * Math.Log10(baselineVeiling / activeVeiling)));

        var advisory = coating.Id switch
        {
            "uncoated-cr39" => "Uncoated CR-39 reflects 7.8% across both faces, creating veiling flare and harsh horizontal glare.",
            "hydrophobic-ar" when env.Id == "rain-night-highway" =>
                "Optimal nocturnal driving optic: 98.8% VLT preserves shadow detail while 0.4% AR eliminates headlamp halos.",
            "hydrophobic-ar" =>
                "0.4% hydrophobic AR erases ghost reflections, though solar horizontal glare still benefits from polarization.",
            _ when env.Id == "rain-night-highway" =>
                "Cuts 96.2% of wet-road Brewster glare at dusk; switch to Hydrophobic AR (98.8% VLT) for pitch-black highway driving.",
            _ =>
                $"Crossed vertical polarizer ({angleDeg:0}°) cancels {glareAttenuationPct:0.0}% horizontal Brewster glare with +{contrastGainDb:0.0} dB contrast."
        };

        return new GlarePhysicsAnalysis(
            EnvironmentId: env.Id,
            EnvironmentLabel: env.Label,
            SurfaceMedium: env.SurfaceMedium,
            RefractiveIndexN2: env.RefractiveIndexN2,
            BrewsterAngleDeg: brewsterAngleDeg,
            BaseGlareLuminanceCdM2: env.BaseGlareLuminanceCdM2,
            CoatingId: coating.Id,
            CoatingLabel: coating.Label,
            AnalyzerAngleDeg: angleDeg,
            MalusCosSquared: malusCosSquared,
            VltPercent: coating.VltPercent,
            SurfaceReflectionPercent: coating.SurfaceReflectionPercent,
            GlareAttenuationPercent: glareAttenuationPct,
            ResidualGlareFraction: residualFraction,
            ResidualGlareLuminanceCdM2: residualLuminance,
            ContrastAcuityGainDb: contrastGainDb,
            BlueLightCutPercent: coating.BlueLightCutPercent,
            Uv400BlockPercent: coating.Uv400BlockPercent,
            CoatingSurchargeUsd: coating.SurchargeUsd,
            ClinicalAdvisory: advisory);
    }

    private static SabaeFrameDecentrationAnalysis EvaluateFrame(
        SabaeFrameDef frame,
        double pdMm,
        EyePrescription od,
        EyePrescription os)
    {
        var framePdMm = Round1(frame.LensWidthMm + frame.BridgeWidthMm);
        var decentrationMm = ComputePerEyeDecentrationMm(frame.LensWidthMm, frame.BridgeWidthMm, pdMm);
        var absDecMm = Round2(Math.Abs(decentrationMm));

        var direction = absDecMm < 0.05
            ? "zero-centered"
            : decentrationMm > 0
                ? "inward-nasal"
                : "outward-temporal";

        var odHorizD = ComputeHorizontalMeridianPowerD(od);
        var osHorizD = ComputeHorizontalMeridianPowerD(os);
        var peakHorizD = Math.Abs(odHorizD) >= Math.Abs(osHorizD) ? odHorizD : osHorizD;

        var odPrism = ComputePrenticePrismDiopters(decentrationMm, odHorizD);
        var osPrism = ComputePrenticePrismDiopters(decentrationMm, osHorizD);
        var peakPrism = Round2(Math.Max(odPrism, osPrism));

        var prismBase = "none";
        if (peakPrism >= 0.01)
        {
            var isBaseIn = (peakHorizD < 0 && decentrationMm > 0) || (peakHorizD > 0 && decentrationMm < 0);
            prismBase = isBaseIn ? "base-in" : "base-out";
        }

        var withinAnsi = peakPrism <= AnsiZ80HorizontalPrismLimitDelta + 1e-6;
        var mbsMm = ComputeMinimumBlankSizeMm(frame.EffectiveDiameterMm, decentrationMm);
        var stockBlankMm = mbsMm <= 65.0 ? 65 : mbsMm <= 70.0 ? 70 : mbsMm <= 75.0 ? 75 : 80;
        var fitsStandard70 = mbsMm <= StandardStockBlankMm + 1e-6;

        var decPenalty = Math.Max(0.0, absDecMm - 1.5) * 6.5;
        var prismPenalty = Math.Max(0.0, peakPrism - 0.5) * 8.0;
        var mbsPenalty = Math.Max(0.0, mbsMm - 68.0) * 2.2;
        var fitScore = Math.Clamp((int)Math.Round(100.0 - decPenalty - prismPenalty - mbsPenalty, MidpointRounding.AwayFromZero), 35, 100);

        string verdict;
        string verdictLabel;
        string verdictGuidance;

        if (absDecMm <= 3.0 && fitsStandard70 && peakPrism <= 1.5)
        {
            verdict = "zero-prism-optimal";
            verdictLabel = "Razor-Sharp Zero-Prism Match";
            verdictGuidance = $"Minimal {absDecMm:0.0} mm decentration aligns pupils near the optical sweet spot with {stockBlankMm} mm stock blank.";
        }
        else if (absDecMm <= 5.5 && mbsMm <= 75.0)
        {
            verdict = "sabae-centration-advised";
            verdictLabel = "Sabae Custom Centration";
            verdictGuidance = $"Requires {absDecMm:0.0} mm lab decentration to neutralize {peakPrism:0.00}Δ Prentice prism ({mbsMm:0} mm MBS).";
        }
        else
        {
            verdict = "oversized-caution";
            verdictLabel = "High Decentration Caution";
            verdictGuidance = $"{absDecMm:0.0} mm decentration induces {peakPrism:0.00}Δ uncompensated prism and requires {mbsMm:0} mm blank; step down lens width.";
        }

        return new SabaeFrameDecentrationAnalysis(
            Sku: frame.Sku,
            FrameName: frame.Name,
            LensWidthMm: frame.LensWidthMm,
            BridgeWidthMm: frame.BridgeWidthMm,
            EffectiveDiameterMm: frame.EffectiveDiameterMm,
            FramePdMm: framePdMm,
            PdMm: pdMm,
            DecentrationPerEyeMm: decentrationMm,
            AbsDecentrationMm: absDecMm,
            DecentrationDirection: direction,
            OdHorizontalPowerD: odHorizD,
            OsHorizontalPowerD: osHorizD,
            PeakHorizontalPowerD: peakHorizD,
            OdPrismDiopters: odPrism,
            OsPrismDiopters: osPrism,
            PeakPrismDiopters: peakPrism,
            PrismBaseDirection: prismBase,
            WithinAnsiZ80Tolerance: withinAnsi,
            MinimumBlankSizeMm: mbsMm,
            RecommendedStockBlankMm: stockBlankMm,
            FitsStandard70mmBlank: fitsStandard70,
            OpticalFitScore: fitScore,
            Verdict: verdict,
            VerdictLabel: verdictLabel,
            VerdictGuidance: verdictGuidance);
    }

    private static double Round1(double val) => Math.Round(val, 1, MidpointRounding.AwayFromZero);
    private static double Round2(double val) => Math.Round(val, 2, MidpointRounding.AwayFromZero);
    private static double Round3(double val) => Math.Round(val, 3, MidpointRounding.AwayFromZero);
}
