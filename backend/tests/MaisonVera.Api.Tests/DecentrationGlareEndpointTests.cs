using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MaisonVera.Api.Contracts;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MaisonVera.Api.Tests;

public sealed class DecentrationGlareEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;

    public DecentrationGlareEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task DecentrationGlare_OceanPolarized90Deg_Returns99Point4PercentAttenuationAndBrewster53Point1()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-3.0, 0.0, 0),
            Os: new EyePrescriptionDto(-3.0, 0.0, 0),
            PdMm: 64.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-01");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.True(result.Valid);
        Assert.Equal(53.1, result.Analysis.Glare.BrewsterAngleDeg);
        Assert.Equal(99.4, result.Analysis.Glare.GlareAttenuationPercent);
        Assert.Equal(24.0, result.Analysis.Glare.VltPercent);
        Assert.Equal(0.4, result.Analysis.Glare.SurfaceReflectionPercent);
        Assert.Equal(0.0, result.Analysis.Glare.MalusCosSquared);
        Assert.True(result.Analysis.Glare.ContrastAcuityGainDb >= 15.0);
        Assert.Equal(4, result.Analysis.AllFrames.Count);
    }

    [Fact]
    public async Task DecentrationGlare_UncoatedCr39_Returns12PercentAttenuation7Point8ReflectionAndZeroDbGain()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "uncoated-cr39",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-01");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(12.0, result.Analysis.Glare.GlareAttenuationPercent);
        Assert.Equal(7.8, result.Analysis.Glare.SurfaceReflectionPercent);
        Assert.Equal(92.0, result.Analysis.Glare.VltPercent);
        Assert.Equal(0.0, result.Analysis.Glare.ContrastAcuityGainDb);
    }

    [Fact]
    public async Task DecentrationGlare_HydrophobicArRainNightHighway_Returns0Point4ReflectionAnd98Point8Vlt()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "rain-night-highway",
            CoatingId: "hydrophobic-ar",
            Od: new EyePrescriptionDto(-1.5, 0.0, 0),
            Os: new EyePrescriptionDto(-1.5, 0.0, 0),
            PdMm: 64.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-03");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(53.7, result.Analysis.Glare.BrewsterAngleDeg);
        Assert.Equal(0.4, result.Analysis.Glare.SurfaceReflectionPercent);
        Assert.Equal(98.8, result.Analysis.Glare.VltPercent);
        Assert.Equal(64.2, result.Analysis.Glare.GlareAttenuationPercent);
        Assert.Contains("nocturnal", result.Analysis.Glare.ClinicalAdvisory, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task DecentrationGlare_AlpineSnowPolarized_Returns52Point6BrewsterAnd98Point9Attenuation()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "alpine-snow",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.5, 0.0, 0),
            Os: new EyePrescriptionDto(-2.5, 0.0, 0),
            PdMm: 65.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-01");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(52.6, result.Analysis.Glare.BrewsterAngleDeg);
        Assert.Equal(98.9, result.Analysis.Glare.GlareAttenuationPercent);
        Assert.True(result.Analysis.Glare.ResidualGlareLuminanceCdM2 < 1500);
    }

    [Theory]
    [InlineData(0.0, 1.0, 42.0)]
    [InlineData(45.0, 0.5, 70.7)]
    [InlineData(90.0, 0.0, 99.4)]
    public async Task DecentrationGlare_MalusLawAngles_FollowsCosSquaredMonotonicity(
        double angleDeg,
        double expectedCosSquared,
        double expectedAttenuationPct)
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0,
            AnalyzerAngleDeg: angleDeg,
            FrameSku: "MV-EYE-01");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(expectedCosSquared, result.Analysis.Glare.MalusCosSquared, precision: 2);
        Assert.Equal(expectedAttenuationPct, result.Analysis.Glare.GlareAttenuationPercent);
    }

    [Fact]
    public async Task DecentrationGlare_NarrowPd58With54mmAviatorAndMinus6D_FlagsOversizedCautionAndRecommends46mmPanto()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-6.0, 0.0, 0),
            Os: new EyePrescriptionDto(-6.0, 0.0, 0),
            PdMm: 58.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-02");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);

        var selected = result.Analysis.SelectedFrame;
        Assert.Equal("MV-EYE-02", selected.Sku);
        Assert.Equal(7.5, selected.DecentrationPerEyeMm);
        Assert.Equal(4.5, selected.PeakPrismDiopters);
        Assert.Equal("base-in", selected.PrismBaseDirection);
        Assert.Equal(75.0, selected.MinimumBlankSizeMm);
        Assert.False(selected.FitsStandard70mmBlank);
        Assert.Equal("oversized-caution", selected.Verdict);
        Assert.Equal("MV-EYE-04", result.Analysis.BestFrameSku);
    }

    [Fact]
    public async Task DecentrationGlare_WidePd73With54mmAviator_AwardsZeroPrismBullseye()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "alpine-snow",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.5, 0.0, 0),
            Os: new EyePrescriptionDto(-2.25, 0.0, 0),
            PdMm: 73.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-02");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);

        var selected = result.Analysis.SelectedFrame;
        Assert.Equal(0.0, selected.DecentrationPerEyeMm);
        Assert.Equal(0.0, selected.PeakPrismDiopters);
        Assert.Equal("zero-centered", selected.DecentrationDirection);
        Assert.Equal("none", selected.PrismBaseDirection);
        Assert.True(selected.WithinAnsiZ80Tolerance);
        Assert.Equal(60.0, selected.MinimumBlankSizeMm);
        Assert.Equal("zero-prism-optimal", selected.Verdict);
        Assert.Equal("MV-EYE-02", result.Analysis.BestFrameSku);
    }

    [Fact]
    public async Task DecentrationGlare_AstigmaticAxis90CompoundsHorizontalPrenticePrism()
    {
        // MV-EYE-01 GCD = 71, PD = 61 => Dec = +5.0 mm (0.5 cm)
        // OD: SPH -3.00 / CYL -2.00 x 90 => F_h = -5.00 D => Delta = 0.5 * 5.00 = 2.50 Delta
        // OS: SPH -3.00 / CYL -2.00 x 180 => F_h = -3.00 D => Delta = 0.5 * 3.00 = 1.50 Delta
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "rain-night-highway",
            CoatingId: "hydrophobic-ar",
            Od: new EyePrescriptionDto(-3.0, -2.0, 90),
            Os: new EyePrescriptionDto(-3.0, -2.0, 180),
            PdMm: 61.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-01");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);

        var selected = result.Analysis.SelectedFrame;
        Assert.Equal(-5.0, selected.OdHorizontalPowerD);
        Assert.Equal(-3.0, selected.OsHorizontalPowerD);
        Assert.Equal(2.5, selected.OdPrismDiopters);
        Assert.Equal(1.5, selected.OsPrismDiopters);
        Assert.Equal(2.5, selected.PeakPrismDiopters);
    }

    [Fact]
    public async Task DecentrationGlare_PlusLensInwardDecentration_ReportsBaseOutPrism()
    {
        // MV-EYE-04 GCD = 67, PD = 61 => Dec = +3.0 mm inward, +3.00 D hyperopia => Base-Out
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "hydrophobic-ar",
            Od: new EyePrescriptionDto(3.0, 0.0, 0),
            Os: new EyePrescriptionDto(3.0, 0.0, 0),
            PdMm: 61.0,
            AnalyzerAngleDeg: 90.0,
            FrameSku: "MV-EYE-04");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<DecentrationGlareHttpResponse>(JsonOptions);
        Assert.NotNull(result);

        Assert.Equal(3.0, result.Analysis.SelectedFrame.DecentrationPerEyeMm);
        Assert.Equal(0.9, result.Analysis.SelectedFrame.PeakPrismDiopters);
        Assert.Equal("base-out", result.Analysis.SelectedFrame.PrismBaseDirection);
    }

    [Fact]
    public async Task DecentrationGlare_InvalidEnvironment_Returns400ValidationProblem()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "martian-dust",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ENVIRONMENT_INVALID", body);
    }

    [Fact]
    public async Task DecentrationGlare_InvalidCoating_Returns400ValidationProblem()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "mirror-chrome-99",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("COATING_INVALID", body);
    }

    [Theory]
    [InlineData(-5.0)]
    [InlineData(95.0)]
    public async Task DecentrationGlare_AnalyzerAngleOutOfRange_Returns400ValidationProblem(double badAngle)
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0,
            AnalyzerAngleDeg: badAngle);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("ANALYZER_ANGLE_OUT_OF_RANGE", body);
    }

    [Fact]
    public async Task DecentrationGlare_UnknownFrameSku_Returns400ValidationProblem()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "alpine-snow",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0,
            FrameSku: "MV-EYE-99");

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("FRAME_SKU_UNKNOWN", body);
    }

    [Fact]
    public async Task DecentrationGlare_PdOutOfPhysiologicalBounds_Returns400ValidationProblem()
    {
        var payload = new DecentrationGlareHttpRequest(
            EnvironmentId: "mediterranean-ocean",
            CoatingId: "polarized-blue-ar",
            Od: new EyePrescriptionDto(-2.0, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 80.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/decentration-glare", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("PD_OUT_OF_RANGE", body);
    }
}
