using System.Text.Json;
using System.Text.Json.Serialization;
using MaisonVera.Api.Contracts;
using MaisonVera.Domain.Atelier;
using MaisonVera.Domain.Fittings;
using MaisonVera.Domain.Optical;
using MaisonVera.Infrastructure.Fittings;

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

builder.Services.AddProblemDetails();
builder.Services.AddSingleton<IFittingReservationStore, InMemoryFittingReservationStore>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AtelierFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4173",
                "http://localhost:5173",
                "http://localhost:8080",
                "https://tvt987.github.io")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("AtelierFrontend");

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    await next();
});

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "maison-vera-optical-atelier-api",
    version = "5.0.0",
    runtime = Environment.Version.ToString(),
    timestampUtc = DateTimeOffset.UtcNow
}));

var apiV1 = app.MapGroup("/api/v1");

apiV1.MapPost("/optical/validate-rx", (ValidateRxHttpRequest? body) =>
{
    if (body is null || body.Od is null || body.Os is null)
    {
        return Results.Problem(
            title: "Malformed optical prescription payload",
            detail: "Both OD (right eye) and OS (left eye) prescription objects are required.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    var spec = MapToDomainRx(body);
    var validation = OpticalRxValidator.Validate(spec);
    if (!validation.IsValid)
    {
        var errorDict = validation.Errors
            .GroupBy(e => e.Field)
            .ToDictionary(g => g.Key, g => g.Select(x => $"{x.Code}: {x.Message}").ToArray());

        return Results.ValidationProblem(
            errors: errorDict,
            title: "Optical prescription failed optometry validation",
            statusCode: StatusCodes.Status400BadRequest);
    }

    var analysis = SagittaOpticalCalculator.Analyze(spec);
    return Results.Ok(new ValidateRxHttpResponse(true, analysis));
});

apiV1.MapPost("/atelier/quote", (AtelierQuoteHttpRequest? body) =>
{
    if (body is null)
    {
        return Results.Problem(
            title: "Malformed atelier quote request",
            detail: "Request body is required.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    var domainRequest = new AtelierQuoteRequest(
        Sku: body.Sku,
        OpticalCoatingId: body.OpticalCoatingId,
        RefractiveIndexId: body.RefractiveIndexId,
        EngravingTierId: body.EngravingTierId,
        EngravingText: body.EngravingText,
        Quantity: body.Quantity,
        Prescription: body.Prescription is null ? null : MapToDomainRx(body.Prescription));

    var result = AtelierCatalog.CalculateQuote(domainRequest);
    if (!result.IsValid || result.Quote is null)
    {
        return Results.ValidationProblem(
            errors: new Dictionary<string, string[]>
            {
                ["quote"] = result.Errors.ToArray()
            },
            title: "Atelier quote validation failed",
            statusCode: StatusCodes.Status400BadRequest);
    }

    return Results.Ok(result.Quote);
});

apiV1.MapPost("/fittings/reserve", (
    HttpContext httpContext,
    ReserveFittingHttpRequest? body,
    IFittingReservationStore store) =>
{
    if (body is null)
    {
        return Results.Problem(
            title: "Malformed fitting reservation payload",
            detail: "Request body is required.",
            statusCode: StatusCodes.Status400BadRequest);
    }

    var headerKey = httpContext.Request.Headers["Idempotency-Key"].FirstOrDefault();
    var idempotencyKey = !string.IsNullOrWhiteSpace(headerKey)
        ? headerKey
        : body.IdempotencyKey ?? string.Empty;

    var command = new ReserveFittingCommand(
        BoutiqueId: body.BoutiqueId,
        SlotStartUtc: body.SlotStartUtc,
        ClientName: body.ClientName,
        ClientEmail: body.ClientEmail,
        PreferredSku: body.PreferredSku,
        Notes: body.Notes,
        IdempotencyKey: idempotencyKey);

    var outcome = store.TryReserve(command);

    return outcome.Status switch
    {
        ReservationOutcomeStatus.Created => CreatedWithHeaders(httpContext, outcome.Reservation!, replayed: false),
        ReservationOutcomeStatus.IdempotentReplay => OkReplayWithHeaders(httpContext, outcome.Reservation!),
        ReservationOutcomeStatus.SlotConflict => Results.Problem(
            title: "Boutique fitting slot already reserved",
            detail: outcome.ErrorMessage,
            statusCode: StatusCodes.Status409Conflict),
        ReservationOutcomeStatus.IdempotencyKeyPayloadMismatch => Results.Problem(
            title: "Idempotency-Key conflict",
            detail: outcome.ErrorMessage,
            statusCode: StatusCodes.Status409Conflict),
        _ => Results.Problem(
            title: "Fitting reservation validation failed",
            detail: outcome.ErrorMessage,
            statusCode: StatusCodes.Status400BadRequest)
    };
});

apiV1.MapGet("/fittings/{reservationId}", (string reservationId, IFittingReservationStore store) =>
{
    var found = store.GetById(reservationId);
    return found is null
        ? Results.Problem(
            title: "Reservation not found",
            detail: $"No boutique fitting reservation matches '{reservationId}'.",
            statusCode: StatusCodes.Status404NotFound)
        : Results.Ok(found);
});

apiV1.MapGet("/fittings/boutiques/{boutiqueId}", (string boutiqueId, IFittingReservationStore store) =>
{
    var boutique = BoutiqueDirectory.FindById(boutiqueId);
    if (boutique is null)
    {
        return Results.Problem(
            title: "Unknown boutique",
            detail: $"Boutique '{boutiqueId}' was not found.",
            statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new
    {
        boutique,
        reservedSlots = store.GetReservedSlots(boutique.BoutiqueId)
    });
});

app.Run();

static OpticalRxSpec MapToDomainRx(ValidateRxHttpRequest dto) => new(
    Od: new EyePrescription(dto.Od.SphereD, dto.Od.CylinderD, dto.Od.AxisDeg),
    Os: new EyePrescription(dto.Os.SphereD, dto.Os.CylinderD, dto.Os.AxisDeg),
    PdMm: dto.PdMm,
    LensDiameterMm: dto.LensDiameterMm,
    BridgeWidthMm: dto.BridgeWidthMm,
    BlueLightFilterEnabled: dto.BlueLightFilterEnabled);

static IResult CreatedWithHeaders(HttpContext ctx, FittingReservation res, bool replayed)
{
    ctx.Response.Headers["X-Idempotency-Replayed"] = replayed ? "true" : "false";
    return Results.Created($"/api/v1/fittings/{res.ReservationId}", res);
}

static IResult OkReplayWithHeaders(HttpContext ctx, FittingReservation res)
{
    ctx.Response.Headers["X-Idempotency-Replayed"] = "true";
    return Results.Ok(res);
}

public partial class Program;
