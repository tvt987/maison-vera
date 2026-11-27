namespace MaisonVera.Domain.Fittings;

public sealed record BoutiqueAtelier(
    string BoutiqueId,
    string Name,
    string City,
    string Address,
    string TimeZone);

public static class BoutiqueDirectory
{
    public static readonly IReadOnlyList<BoutiqueAtelier> All =
    [
        new("paris-marais", "Paris Le Marais Flagship", "Paris", "14 Rue des Francs-Bourgeois, 75003 Paris", "Europe/Paris"),
        new("tokyo-aoyama", "Tokyo Aoyama Optical Salon", "Tokyo", "5-7-21 Minami-Aoyama, Minato-ku, Tokyo", "Asia/Tokyo"),
        new("saigon-dongkhoi", "Saigon Dong Khoi Private Suite", "Ho Chi Minh City", "88 Dong Khoi, District 1, HCMC", "Asia/Ho_Chi_Minh"),
        new("sabae-atelier", "Sabae Master Milling Atelier", "Fukui", "2-14 Shinmei-cho, Sabae, Fukui", "Asia/Tokyo")
    ];

    public static BoutiqueAtelier? FindById(string? id)
    {
        if (string.IsNullOrWhiteSpace(id)) return null;
        return All.FirstOrDefault(b => b.BoutiqueId.Equals(id.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}

public sealed record ReserveFittingCommand(
    string BoutiqueId,
    DateTimeOffset SlotStartUtc,
    string ClientName,
    string ClientEmail,
    string? PreferredSku,
    string? Notes,
    string IdempotencyKey);

public sealed record FittingReservation(
    string ReservationId,
    string BoutiqueId,
    string BoutiqueName,
    DateTimeOffset SlotStartUtc,
    DateTimeOffset SlotEndUtc,
    string ClientName,
    string ClientEmail,
    string PreferredSku,
    string? Notes,
    string IdempotencyKey,
    DateTimeOffset CreatedAtUtc);

public enum ReservationOutcomeStatus
{
    Created,
    IdempotentReplay,
    SlotConflict,
    IdempotencyKeyPayloadMismatch,
    ValidationFailed
}

public sealed record ReservationOutcome(
    ReservationOutcomeStatus Status,
    FittingReservation? Reservation,
    string? ErrorMessage);

public interface IFittingReservationStore
{
    ReservationOutcome TryReserve(ReserveFittingCommand command);
    FittingReservation? GetById(string reservationId);
    IReadOnlyList<FittingReservation> GetReservedSlots(string boutiqueId);
}
