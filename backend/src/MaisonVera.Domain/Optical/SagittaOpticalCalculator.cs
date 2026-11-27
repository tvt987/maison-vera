namespace MaisonVera.Domain.Optical;

public static class SagittaOpticalCalculator
{
    public static double GetDominantMeridianPower(EyePrescription eye)
    {
        var m1 = eye.SphereD;
        var m2 = eye.SphereD + eye.CylinderD;
        return Round2(Math.Abs(m2) >= Math.Abs(m1) ? m2 : m1);
    }

    public static (double SemiDiameterMm, double DecentrationPerEyeMm) ComputeEffectiveSemiDiameter(
        double lensDiameterMm,
        double pdMm,
        double bridgeWidthMm = 20.0)
    {
        var clampedDiameter = Math.Clamp(lensDiameterMm, OpticalRxValidator.LensDiameterMinMm, OpticalRxValidator.LensDiameterMaxMm);
        var clampedPd = Math.Clamp(pdMm, OpticalRxValidator.PdMinMm, OpticalRxValidator.PdMaxMm);
        var framePdMm = clampedDiameter + bridgeWidthMm;
        var decentrationPerEyeMm = Round2(Math.Max(0.0, (framePdMm - clampedPd) / 2.0));
        var semiDiameterMm = Round2(Math.Clamp(clampedDiameter / 2.0 + decentrationPerEyeMm * 0.45, 22.0, 33.0));
        return (semiDiameterMm, decentrationPerEyeMm);
    }

    public static EyeThicknessMetrics ComputeEyeThickness(
        EyePrescription eye,
        RefractiveIndexSpec material,
        double semiDiameterMm)
    {
        var dominantPowerD = GetDominantMeridianPower(eye);
        var sphericalEquivalentD = Round2(eye.SphereD + eye.CylinderD / 2.0);
        var absPower = Math.Abs(dominantPowerD);

        double sagittaMm = 0.0;
        double centerThicknessMm = material.MinCenterThicknessMm;
        double edgeThicknessMm = material.MinCenterThicknessMm;

        if (absPower >= 1e-6)
        {
            var radiusMm = 1000.0 * (material.RefractiveIndex - 1.0) / absPower;
            var hEff = Math.Min(semiDiameterMm, radiusMm * 0.98);
            var rawSagitta = radiusMm - Math.Sqrt(radiusMm * radiusMm - hEff * hEff);
            sagittaMm = Round2(rawSagitta * material.AsphericFactor);

            if (dominantPowerD < 0)
            {
                centerThicknessMm = Round2(material.MinCenterThicknessMm);
                edgeThicknessMm = Round2(material.MinCenterThicknessMm + rawSagitta * material.AsphericFactor);
            }
            else
            {
                edgeThicknessMm = Round2(material.MinEdgeThicknessMm);
                centerThicknessMm = Round2(material.MinEdgeThicknessMm + rawSagitta * material.AsphericFactor);
            }
        }

        var maxThicknessMm = Math.Max(centerThicknessMm, edgeThicknessMm);
        var avgThicknessMm = (centerThicknessMm + edgeThicknessMm) / 2.0;
        var volumeCm3 = Math.PI * semiDiameterMm * semiDiameterMm * avgThicknessMm / 1000.0;
        var weightGrams = Round1(volumeCm3 * material.DensityGcm3);

        return new EyeThicknessMetrics(
            DominantPowerD: dominantPowerD,
            SphericalEquivalentD: sphericalEquivalentD,
            SagittaMm: sagittaMm,
            CenterThicknessMm: centerThicknessMm,
            EdgeThicknessMm: edgeThicknessMm,
            MaxThicknessMm: maxThicknessMm,
            WeightGrams: weightGrams);
    }

    public static SpectralProfileSummary ComputeSpectralProfile(bool blueLightFilterEnabled)
    {
        var profile = blueLightFilterEnabled ? "uv400-blue-cut" : "uv400-ar";
        var samples = new List<SpectralPoint>(41);

        for (var wl = 380; wl <= 780; wl += 10)
        {
            var baseline = ComputeWavelengthTransmittance(wl, false);
            var active = ComputeWavelengthTransmittance(wl, blueLightFilterEnabled);
            samples.Add(new SpectralPoint(wl, baseline, active));
        }

        var uvAvg = samples.Where(s => s.WavelengthNm <= 400).Average(s => s.ActiveTransmittancePct);
        var hevAvg = samples.Where(s => s.WavelengthNm is >= 410 and <= 450).Average(s => s.ActiveTransmittancePct);
        var visAvg = samples.Where(s => s.WavelengthNm is >= 500 and <= 780).Average(s => s.ActiveTransmittancePct);

        return new SpectralProfileSummary(
            Profile: profile,
            Uv400BlockPercent: Round1(100.0 - uvAvg),
            HevBlueFilterPercent: Round1(100.0 - hevAvg),
            VisibleAvgTransmittancePercent: Round1(visAvg),
            Samples: samples);
    }

    public static OpticalRxAnalysis Analyze(OpticalRxSpec spec)
    {
        var (semiDiameterMm, decentrationPerEyeMm) = ComputeEffectiveSemiDiameter(
            spec.LensDiameterMm,
            spec.PdMm,
            spec.BridgeWidthMm);

        var strongestAbsD = Round2(Math.Max(
            Math.Abs(GetDominantMeridianPower(spec.Od)),
            Math.Abs(GetDominantMeridianPower(spec.Os))));

        var recommended = RefractiveIndexCatalog.RecommendForPower(strongestAbsD);

        var rawList = RefractiveIndexCatalog.All.Select(mat =>
        {
            var od = ComputeEyeThickness(spec.Od, mat, semiDiameterMm);
            var os = ComputeEyeThickness(spec.Os, mat, semiDiameterMm);
            return new
            {
                Material = mat,
                Od = od,
                Os = os,
                PeakCenter = Math.Max(od.CenterThicknessMm, os.CenterThicknessMm),
                PeakEdge = Math.Max(od.EdgeThicknessMm, os.EdgeThicknessMm),
                PeakMax = Math.Max(od.MaxThicknessMm, os.MaxThicknessMm),
                PairWeight = Round1(od.WeightGrams + os.WeightGrams)
            };
        }).ToList();

        var baseline = rawList[0];

        var comparisons = rawList.Select(row =>
        {
            var edgeRed = baseline.PeakEdge > 0
                ? Round1((baseline.PeakEdge - row.PeakEdge) / baseline.PeakEdge * 100.0)
                : 0.0;
            var maxRed = baseline.PeakMax > 0
                ? Round1((baseline.PeakMax - row.PeakMax) / baseline.PeakMax * 100.0)
                : 0.0;

            return new IndexComparisonMetrics(
                IndexId: row.Material.Id,
                IndexCode: row.Material.Code,
                DisplayName: row.Material.DisplayName,
                RefractiveIndex: row.Material.RefractiveIndex,
                AbbeValue: row.Material.AbbeValue,
                SurchargeUsd: row.Material.SurchargeUsd,
                Od: row.Od,
                Os: row.Os,
                PeakCenterThicknessMm: row.PeakCenter,
                PeakEdgeThicknessMm: row.PeakEdge,
                PeakThicknessMm: row.PeakMax,
                EdgeReductionPercentVs150: edgeRed,
                MaxThicknessReductionPercentVs150: maxRed,
                PairWeightGrams: row.PairWeight,
                Fits4mmTitaniumRim: row.PeakEdge <= RefractiveIndexCatalog.TitaniumRimDepthMm + 0.05,
                IsRecommended: row.Material.Id == recommended.Id);
        }).ToList();

        var spectral = ComputeSpectralProfile(spec.BlueLightFilterEnabled);
        var totalUpgradeUsd = recommended.SurchargeUsd +
            (spec.BlueLightFilterEnabled ? RefractiveIndexCatalog.BlueLightStudioSurchargeUsd : 0m);

        return new OpticalRxAnalysis(
            EffectiveSemiDiameterMm: semiDiameterMm,
            DecentrationPerEyeMm: decentrationPerEyeMm,
            StrongestMeridianAbsD: strongestAbsD,
            RecommendedIndexId: recommended.Id,
            RecommendedIndexCode: recommended.Code,
            RecommendedIndexLabel: recommended.DisplayName,
            RecommendedUpgradeUsd: totalUpgradeUsd,
            Comparisons: comparisons,
            Spectral: spectral);
    }

    private static double ComputeWavelengthTransmittance(int wavelengthNm, bool blueCut)
    {
        if (wavelengthNm <= 390) return 0.1;
        if (wavelengthNm == 400) return blueCut ? 0.2 : 0.4;

        var uvRamp = 1.0 / (1.0 + Math.Exp(-(wavelengthNm - 408.0) / 4.2));
        var baseAr = 98.4 * uvRamp;
        if (!blueCut)
        {
            return Round1(Math.Clamp(baseAr, 0.2, 98.8));
        }

        var hevNotch = 58.0 * Math.Exp(-Math.Pow((wavelengthNm - 432.0) / 19.5, 2.0));
        var violetCut = 34.0 * Math.Exp(-Math.Pow((wavelengthNm - 410.0) / 10.5, 2.0));
        return Round1(Math.Clamp(baseAr - hevNotch - violetCut, 0.2, 97.8));
    }

    private static double Round1(double val) => Math.Round(val, 1, MidpointRounding.AwayFromZero);
    private static double Round2(double val) => Math.Round(val, 2, MidpointRounding.AwayFromZero);
}
