using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using MaisonVera.Api.Contracts;
using MaisonVera.Domain.Fittings;
using Microsoft.AspNetCore.Mvc.Testing;

namespace MaisonVera.Api.Tests;

public sealed class FittingReservationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _client;

    public FittingReservationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_Returns200HealthyWithSecurityHeaders()
    {
        var response = await _client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("strict-origin-when-cross-origin", response.Headers.GetValues("Referrer-Policy").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());

        var json = await response.Content.ReadAsStringAsync();
        Assert.Contains("healthy", json);
        Assert.Contains("5.0.0", json);
    }

    [Fact]
    public async Task ReserveFitting_FreshSlot_Returns201CreatedAndCanBeRetrieved()
    {
        var slot = new DateTimeOffset(2026, 12, 10, 10, 0, 0, TimeSpan.Zero);
        var req = new ReserveFittingHttpRequest(
            BoutiqueId: "paris-marais",
            SlotStartUtc: slot,
            ClientName: "Claire Moreau",
            ClientEmail: "claire.moreau@atelier.fr",
            PreferredSku: "MV-EYE-01");

        using var msg = new HttpRequestMessage(HttpMethod.Post, "/api/v1/fittings/reserve")
        {
            Content = JsonContent.Create(req)
        };
        msg.Headers.Add("Idempotency-Key", "idem-paris-fresh-001");

        var response = await _client.SendAsync(msg);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("false", response.Headers.GetValues("X-Idempotency-Replayed").Single());

        var created = await response.Content.ReadFromJsonAsync<FittingReservation>(JsonOptions);
        Assert.NotNull(created);
        Assert.StartsWith("MVF-", created.ReservationId);
        Assert.Equal(slot.AddMinutes(45), created.SlotEndUtc);

        var fetched = await _client.GetFromJsonAsync<FittingReservation>(
            $"/api/v1/fittings/{created.ReservationId}",
            JsonOptions);
        Assert.NotNull(fetched);
        Assert.Equal(created.ReservationId, fetched.ReservationId);
    }

    [Fact]
    public async Task ReserveFitting_DuplicateIdempotencyKey_ReplaysIdenticalReservationWithoutConflict()
    {
        var slot = new DateTimeOffset(2026, 12, 11, 14, 30, 0, TimeSpan.Zero);
        var req = new ReserveFittingHttpRequest(
            BoutiqueId: "tokyo-aoyama",
            SlotStartUtc: slot,
            ClientName: "Kenji Takahashi",
            ClientEmail: "kenji@aoyama.jp",
            PreferredSku: "MV-EYE-01");

        async Task<(HttpStatusCode Status, string Replayed, FittingReservation? Body)> SendOnce()
        {
            using var msg = new HttpRequestMessage(HttpMethod.Post, "/api/v1/fittings/reserve")
            {
                Content = JsonContent.Create(req)
            };
            msg.Headers.Add("Idempotency-Key", "idem-tokyo-replay-002");
            var res = await _client.SendAsync(msg);
            var body = await res.Content.ReadFromJsonAsync<FittingReservation>(JsonOptions);
            return (res.StatusCode, res.Headers.GetValues("X-Idempotency-Replayed").Single(), body);
        }

        var first = await SendOnce();
        var second = await SendOnce();

        Assert.Equal(HttpStatusCode.Created, first.Status);
        Assert.Equal("false", first.Replayed);
        Assert.Equal(HttpStatusCode.OK, second.Status);
        Assert.Equal("true", second.Replayed);
        Assert.NotNull(first.Body);
        Assert.NotNull(second.Body);
        Assert.Equal(first.Body.ReservationId, second.Body.ReservationId);
    }

    [Fact]
    public async Task ReserveFitting_SameSlotDifferentClient_Returns409Conflict()
    {
        var slot = new DateTimeOffset(2026, 12, 12, 9, 0, 0, TimeSpan.Zero);

        var firstReq = new ReserveFittingHttpRequest(
            BoutiqueId: "saigon-dongkhoi",
            SlotStartUtc: slot,
            ClientName: "Truong Van Tinh",
            ClientEmail: "tinh@maison-vera.vn",
            IdempotencyKey: "idem-saigon-first-003");

        var secondReq = new ReserveFittingHttpRequest(
            BoutiqueId: "saigon-dongkhoi",
            SlotStartUtc: slot,
            ClientName: "Minh Anh",
            ClientEmail: "minhanh@client.vn",
            IdempotencyKey: "idem-saigon-second-004");

        var firstRes = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", firstReq);
        var secondRes = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", secondReq);

        Assert.Equal(HttpStatusCode.Created, firstRes.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, secondRes.StatusCode);
    }

    [Fact]
    public async Task ReserveFitting_ConcurrentBurstOf16RequestsOnSameSlot_ExactlyOne201AndFifteen409Conflicts()
    {
        var contestedSlot = new DateTimeOffset(2026, 12, 15, 16, 0, 0, TimeSpan.Zero);

        var tasks = Enumerable.Range(0, 16).Select(async idx =>
        {
            var req = new ReserveFittingHttpRequest(
                BoutiqueId: "sabae-atelier",
                SlotStartUtc: contestedSlot,
                ClientName: $"Collector {idx}",
                ClientEmail: $"collector{idx}@atelier.jp",
                IdempotencyKey: $"idem-race-burst-{idx:D3}");

            var res = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", req);
            return res.StatusCode;
        });

        var statuses = await Task.WhenAll(tasks);

        Assert.Equal(1, statuses.Count(s => s == HttpStatusCode.Created));
        Assert.Equal(15, statuses.Count(s => s == HttpStatusCode.Conflict));
    }

    [Fact]
    public async Task ReserveFitting_ReusedIdempotencyKeyWithDifferentSlot_Returns409Conflict()
    {
        var key = "idem-mismatch-guard-005";
        var reqA = new ReserveFittingHttpRequest(
            BoutiqueId: "paris-marais",
            SlotStartUtc: new DateTimeOffset(2026, 12, 18, 11, 0, 0, TimeSpan.Zero),
            ClientName: "Elena Vance",
            ClientEmail: "elena@paris.fr",
            IdempotencyKey: key);

        var reqB = reqA with
        {
            SlotStartUtc = new DateTimeOffset(2026, 12, 18, 13, 0, 0, TimeSpan.Zero)
        };

        var resA = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", reqA);
        var resB = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", reqB);

        Assert.Equal(HttpStatusCode.Created, resA.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, resB.StatusCode);
    }

    [Fact]
    public async Task ReserveFitting_InvalidBoutiqueOrOffHalfHourSlot_Returns400BadRequest()
    {
        var badSlot = new ReserveFittingHttpRequest(
            BoutiqueId: "paris-marais",
            SlotStartUtc: new DateTimeOffset(2026, 12, 20, 10, 17, 0, TimeSpan.Zero),
            ClientName: "Jean Luc",
            ClientEmail: "jean@paris.fr",
            IdempotencyKey: "idem-bad-minute-006");

        var badBoutique = badSlot with
        {
            BoutiqueId = "milan-unknown",
            SlotStartUtc = new DateTimeOffset(2026, 12, 20, 10, 0, 0, TimeSpan.Zero),
            IdempotencyKey = "idem-bad-boutique-007"
        };

        var resSlot = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", badSlot);
        var resBoutique = await _client.PostAsJsonAsync("/api/v1/fittings/reserve", badBoutique);

        Assert.Equal(HttpStatusCode.BadRequest, resSlot.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, resBoutique.StatusCode);
    }
}
