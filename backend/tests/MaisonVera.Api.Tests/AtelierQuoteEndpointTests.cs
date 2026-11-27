using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MaisonVera.Api.Contracts;
using MaisonVera.Domain.Atelier;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MaisonVera.Api.Tests;

public sealed class AtelierQuoteEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;

    public AtelierQuoteEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Quote_WithHighMyopiaRxAnd18kGoldEngraving_ComputesExactUsdVndAnd30PctDeposit()
    {
        var req = new AtelierQuoteHttpRequest(
            Sku: "MV-EYE-01",
            OpticalCoatingId: "blue-light-studio",
            RefractiveIndexId: null, // auto-select from Rx (-6.00 D => 1.74 +$240)
            EngravingTierId: "gold-18k-inlay",
            EngravingText: "t.v. tinh!! #999",
            Quantity: 1,
            Prescription: new ValidateRxHttpRequest(
                Od: new EyePrescriptionDto(-6.0, -0.5, 180),
                Os: new EyePrescriptionDto(-5.75, -0.25, 175),
                PdMm: 63.0));

        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var quote = await response.Content.ReadFromJsonAsync<AtelierQuoteBreakdown>(JsonOptions);
        Assert.NotNull(quote);
        Assert.Equal("MV-EYE-01", quote.Sku);
        Assert.Equal("1.74", quote.RefractiveIndexCode);
        Assert.Equal(480m, quote.BaseFrameUsd);
        Assert.Equal(65m, quote.OpticalCoatingUsd);
        Assert.Equal(240m, quote.RefractiveIndexUsd);
        Assert.Equal(95m, quote.EngravingUsd);
        Assert.Equal(880m, quote.GrandTotalUsd);
        Assert.Equal("T.V. TINH 99", quote.SanitizedEngravingText);
        Assert.True(quote.GrandTotalVnd > 22_000_000m);
        Assert.True(quote.VipDeposit30PercentVnd > 6_500_000m);
        Assert.NotNull(quote.RxAnalysis);
    }

    [Fact]
    public async Task Quote_ExplicitRefractiveIndexWithoutPrescription_AppliesRequestedIndexPricing()
    {
        var req = new AtelierQuoteHttpRequest(
            Sku: "MV-EYE-03",
            OpticalCoatingId: "polarized-amber",
            RefractiveIndexId: "1.67",
            EngravingTierId: "micro-laser",
            EngravingText: "PARIS 26",
            Quantity: 2);

        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var quote = await response.Content.ReadFromJsonAsync<AtelierQuoteBreakdown>(JsonOptions);
        Assert.NotNull(quote);
        Assert.Equal(360m, quote.BaseFrameUsd);
        Assert.Equal(85m, quote.OpticalCoatingUsd);
        Assert.Equal(140m, quote.RefractiveIndexUsd);
        Assert.Equal(45m, quote.EngravingUsd);
        Assert.Equal(630m, quote.UnitTotalUsd);
        Assert.Equal(1260m, quote.GrandTotalUsd);
        Assert.Equal("PARIS 26", quote.SanitizedEngravingText);
    }

    [Fact]
    public async Task Quote_UnknownSku_Returns400BadRequest()
    {
        var req = new AtelierQuoteHttpRequest(Sku: "MV-UNKNOWN-99");
        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Quote_UnknownCoating_Returns400BadRequest()
    {
        var req = new AtelierQuoteHttpRequest(Sku: "MV-EYE-01", OpticalCoatingId: "quantum-laser");
        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Quote_ExcessiveQuantity_Returns400BadRequest()
    {
        var req = new AtelierQuoteHttpRequest(Sku: "MV-EYE-01", Quantity: 25);
        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Quote_InvalidEmbeddedPrescription_Returns400BadRequest()
    {
        var req = new AtelierQuoteHttpRequest(
            Sku: "MV-EYE-01",
            Prescription: new ValidateRxHttpRequest(
                Od: new EyePrescriptionDto(-3.0, -1.25, null),
                Os: new EyePrescriptionDto(-3.0, 0.0, 0),
                PdMm: 64.0));

        var response = await _client.PostAsJsonAsync("/api/v1/atelier/quote", req);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
