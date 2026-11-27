namespace MaisonVera.Domain.Optical;

public static class OpticalRxValidator
{
    public const double SphereMinD = -10.0;
    public const double SphereMaxD = 6.0;
    public const double CylinderMinD = -4.0;
    public const double CylinderMaxD = 0.0;
    public const int AxisMinDeg = 1;
    public const int AxisMaxDeg = 180;
    public const double PdMinMm = 54.0;
    public const double PdMaxMm = 74.0;
    public const double LensDiameterMinMm = 44.0;
    public const double LensDiameterMaxMm = 62.0;

    public static bool IsQuarterDiopterStep(double value) =>
        double.IsFinite(value) && Math.Abs(value * 4.0 - Math.Round(value * 4.0)) < 1e-6;

    public static bool IsHalfMillimeterStep(double value) =>
        double.IsFinite(value) && Math.Abs(value * 2.0 - Math.Round(value * 2.0)) < 1e-6;

    public static RxValidationResult Validate(OpticalRxSpec spec)
    {
        var errors = new List<RxValidationIssue>();

        ValidateEye("od", "Right Eye (OD)", spec.Od, errors);
        ValidateEye("os", "Left Eye (OS)", spec.Os, errors);

        if (!double.IsFinite(spec.PdMm) || spec.PdMm < PdMinMm - 1e-6 || spec.PdMm > PdMaxMm + 1e-6)
        {
            errors.Add(new RxValidationIssue(
                "pdMm",
                "PD_OUT_OF_RANGE",
                "Pupillary Distance (PD) must be within physiological bounds (54.0–74.0 mm)."));
        }
        else if (!IsHalfMillimeterStep(spec.PdMm))
        {
            errors.Add(new RxValidationIssue(
                "pdMm",
                "PD_INVALID_STEP",
                "Pupillary Distance (PD) must use 0.5 mm precision steps."));
        }

        if (!double.IsFinite(spec.LensDiameterMm) ||
            spec.LensDiameterMm < LensDiameterMinMm - 1e-6 ||
            spec.LensDiameterMm > LensDiameterMaxMm + 1e-6)
        {
            errors.Add(new RxValidationIssue(
                "lensDiameterMm",
                "DIAMETER_OUT_OF_RANGE",
                "Frame lens diameter must be between 44 mm and 62 mm."));
        }

        return new RxValidationResult(errors.Count == 0, errors);
    }

    private static void ValidateEye(
        string key,
        string label,
        EyePrescription eye,
        List<RxValidationIssue> errors)
    {
        if (!double.IsFinite(eye.SphereD) || eye.SphereD < SphereMinD - 1e-6 || eye.SphereD > SphereMaxD + 1e-6)
        {
            errors.Add(new RxValidationIssue(
                $"{key}.sphereD",
                "SPHERE_OUT_OF_RANGE",
                $"{label} Sphere must be between -10.00 D and +6.00 D."));
        }
        else if (!IsQuarterDiopterStep(eye.SphereD))
        {
            errors.Add(new RxValidationIssue(
                $"{key}.sphereD",
                "SPHERE_INVALID_STEP",
                $"{label} Sphere must use exact 0.25 D optometry steps."));
        }

        if (!double.IsFinite(eye.CylinderD) || eye.CylinderD < CylinderMinD - 1e-6 || eye.CylinderD > CylinderMaxD + 1e-6)
        {
            errors.Add(new RxValidationIssue(
                $"{key}.cylinderD",
                "CYLINDER_OUT_OF_RANGE",
                $"{label} Cylinder must be between -4.00 D and 0.00 D."));
        }
        else if (!IsQuarterDiopterStep(eye.CylinderD))
        {
            errors.Add(new RxValidationIssue(
                $"{key}.cylinderD",
                "CYLINDER_INVALID_STEP",
                $"{label} Cylinder must use exact 0.25 D optometry steps."));
        }

        var hasCylinder = double.IsFinite(eye.CylinderD) && Math.Abs(eye.CylinderD) > 1e-6;
        if (hasCylinder)
        {
            if (eye.AxisDeg is null)
            {
                errors.Add(new RxValidationIssue(
                    $"{key}.axisDeg",
                    "AXIS_REQUIRED",
                    $"{label} Axis (1–180°) is required whenever Cylinder is non-zero."));
            }
            else if (eye.AxisDeg.Value < AxisMinDeg || eye.AxisDeg.Value > AxisMaxDeg)
            {
                errors.Add(new RxValidationIssue(
                    $"{key}.axisDeg",
                    "AXIS_OUT_OF_RANGE",
                    $"{label} Axis must be an integer between 1° and 180°."));
            }
        }
        else if (eye.AxisDeg is not null && (eye.AxisDeg.Value < 0 || eye.AxisDeg.Value > AxisMaxDeg))
        {
            errors.Add(new RxValidationIssue(
                $"{key}.axisDeg",
                "AXIS_OUT_OF_RANGE",
                $"{label} Axis must be between 0° and 180°."));
        }
    }
}
