using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MaisonVera.Api.Contracts;
using MaisonVera.Domain.Optical;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MaisonVera.Api.Tests;

public sealed class OpticalRxEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;

    public OpticalRxEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task ValidateRx_HighMyopiaMinus6_ReturnsStrictSagittaMonotonicityAndRecommends174()
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-6.0, 0.0, 0),
            Os: new EyePrescriptionDto(-6.0, 0.0, 0),
            PdMm: 64.0,
            LensDiameterMm: 51.0,
            BridgeWidthMm: 20.0,
            BlueLightFilterEnabled: true);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ValidateRxHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.True(result.Valid);
        Assert.Equal("ultra-174", result.Analysis.RecommendedIndexId);
        Assert.Equal("1.74", result.Analysis.RecommendedIndexCode);
        Assert.Equal(4, result.Analysis.Comparisons.Count);

        var edge150 = result.Analysis.Comparisons[0].PeakEdgeThicknessMm;
        var edge159 = result.Analysis.Comparisons[1].PeakEdgeThicknessMm;
        var edge167 = result.Analysis.Comparisons[2].PeakEdgeThicknessMm;
        var edge174 = result.Analysis.Comparisons[3].PeakEdgeThicknessMm;

        Assert.True(edge174 < edge167, $"Expected 1.74 ({edge174}) < 1.67 ({edge167})");
        Assert.True(edge167 < edge159, $"Expected 1.67 ({edge167}) < 1.59 ({edge159})");
        Assert.True(edge159 < edge150, $"Expected 1.59 ({edge159}) < 1.50 ({edge150})");
        Assert.True(edge150 > 6.0);
        Assert.True(edge174 < 4.0);
        Assert.True(result.Analysis.Comparisons[3].Fits4mmTitaniumRim);
        Assert.False(result.Analysis.Comparisons[0].Fits4mmTitaniumRim);
    }

    [Theory]
    [InlineData(-2.10, 0.0)]
    [InlineData(-1.33, 0.0)]
    [InlineData(0.10, -0.25)]
    [InlineData(-3.00, -0.35)]
    public async Task ValidateRx_NonQuarterDiopterStep_Returns400BadRequest(double sphereD, double cylD)
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(sphereD, cylD, cylD == 0 ? 0 : 90),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("INVALID_STEP", body);
    }

    [Fact]
    public async Task ValidateRx_NonZeroCylinderWithMissingAxis_Returns400BadRequest()
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-3.25, -1.50, null),
            Os: new EyePrescriptionDto(-3.00, 0.0, null),
            PdMm: 63.5);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("AXIS_REQUIRED", body);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    [InlineData(181)]
    public async Task ValidateRx_NonZeroCylinderWithOutOfRangeAxis_Returns400BadRequest(int badAxis)
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-2.50, -0.75, badAxis),
            Os: new EyePrescriptionDto(-2.50, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("AXIS_OUT_OF_RANGE", body);
    }

    [Fact]
    public async Task ValidateRx_ZeroCylinderWithNullAxis_Returns200Ok()
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-1.50, 0.0, null),
            Os: new EyePrescriptionDto(-1.75, 0.0, null),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ValidateRxHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal("cr39-150", result.Analysis.RecommendedIndexId);
    }

    [Theory]
    [InlineData(-10.25)]
    [InlineData(6.25)]
    public async Task ValidateRx_SphereOutOfRange_Returns400BadRequest(double sphereD)
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(sphereD, 0.0, 0),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("SPHERE_OUT_OF_RANGE", body);
    }

    [Theory]
    [InlineData(0.25)]
    [InlineData(-4.25)]
    public async Task ValidateRx_CylinderOutOfRange_Returns400BadRequest(double cylD)
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-2.0, cylD, 90),
            Os: new EyePrescriptionDto(-2.0, 0.0, 0),
            PdMm: 64.0);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("CYLINDER_OUT_OF_RANGE", body);
    }

    [Theory]
    [InlineData(53.5)]
    [InlineData(74.5)]
    public async Task ValidateRx_PhysiologicalPdOutOfBounds_Returns400BadRequest(double pdMm)
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-3.0, 0.0, 0),
            Os: new EyePrescriptionDto(-3.0, 0.0, 0),
            PdMm: pdMm);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("PD_OUT_OF_RANGE", body);
    }

    [Fact]
    public async Task ValidateRx_HyperopiaPlus4_CenterThickerThanEdgeAndMonotonicThinning()
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(4.0, 0.0, 0),
            Os: new EyePrescriptionDto(4.0, 0.0, 0),
            PdMm: 64.0,
            LensDiameterMm: 50.0,
            BlueLightFilterEnabled: false);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ValidateRxHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal("high-167", result.Analysis.RecommendedIndexId);

        foreach (var row in result.Analysis.Comparisons)
        {
            Assert.True(row.PeakCenterThicknessMm > row.PeakEdgeThicknessMm);
        }

        Assert.True(result.Analysis.Comparisons[3].PeakCenterThicknessMm < result.Analysis.Comparisons[2].PeakCenterThicknessMm);
        Assert.True(result.Analysis.Comparisons[2].PeakCenterThicknessMm < result.Analysis.Comparisons[1].PeakCenterThicknessMm);
        Assert.True(result.Analysis.Comparisons[1].PeakCenterThicknessMm < result.Analysis.Comparisons[0].PeakCenterThicknessMm);
    }

    [Fact]
    public async Task ValidateRx_AstigmaticCompoundingAndSpectralTransmittanceCurve_Returns41PointsAndUv400Block()
    {
        var payload = new ValidateRxHttpRequest(
            Od: new EyePrescriptionDto(-4.0, -2.0, 175),
            Os: new EyePrescriptionDto(-3.5, -1.0, 10),
            PdMm: 62.5,
            BlueLightFilterEnabled: true);

        var response = await _client.PostAsJsonAsync("/api/v1/optical/validate-rx", payload);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ValidateRxHttpResponse>(JsonOptions);
        Assert.NotNull(result);
        Assert.Equal(6.0, result.Analysis.StrongestMeridianAbsD);
        Assert.Equal("ultra-174", result.Analysis.RecommendedIndexId);
        Assert.Equal(41, result.Analysis.Spectral.Samples.Count);
        Assert.Equal(380, result.Analysis.Spectral.Samples[0].WavelengthNm);
        Assert.Equal(780, result.Analysis.Spectral.Samples[^1].WavelengthNm);
        Assert.True(result.Analysis.Spectral.Uv400BlockPercent >= 99.5);
        Assert.True(result.Analysis.Spectral.HevBlueFilterPercent >= 50.0);
        Assert.True(result.Analysis.Spectral.VisibleAvgTransmittancePercent >= 95.0);
    }
}
