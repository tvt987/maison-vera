using System.Security.Cryptography;
using System.Text;
using MaisonVera.Domain.Fittings;

namespace MaisonVera.Infrastructure.Fittings;

/// <summary>
/// Thread-safe, concurrency-atomic Private Fitting Reservation Store implementing:
///   1. Double-booking prevention on normalized (BoutiqueId, SlotStartUtc) keys
///   2. RFC-compliant Idempotency-Key deduplication with payload-fingerprint verification
/// Designed as an in-memory adapter behind IFittingReservationStore, swappable for
/// PostgreSQL UNIQUE(boutique_id, slot_start_utc) + Redis distributed locks in multi-node deployments.
/// </summary>
public sealed class InMemoryFittingReservationStore : IFittingReservationStore
{
    private readonly Lock _gate = new();
    private readonly Dictionary<string, FittingReservation> _bySlotKey = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, (string Fingerprint, FittingReservation Reservation)> _byIdempotencyKey = new(StringComparer.Ordinal);
    private readonly Dictionary<string, FittingReservation> _byReservationId = new(StringComparer.OrdinalIgnoreCase);

    public ReservationOutcome TryReserve(ReserveFittingCommand command)
    {
        var boutique = BoutiqueDirectory.FindById(command.BoutiqueId);
        if (boutique is null)
        {
            return new ReservationOutcome(
                ReservationOutcomeStatus.ValidationFailed,
                null,
                $"Unknown boutique '{command.BoutiqueId}'. Supported: paris-marais, tokyo-aoyama, saigon-dongkhoi, sabae-atelier.");
        }

        if (string.IsNullOrWhiteSpace(command.ClientName) || command.ClientName.Trim().Length < 2)
        {
            return new ReservationOutcome(
                ReservationOutcomeStatus.ValidationFailed,
                null,
                "ClientName must be at least 2 characters.");
        }

        if (string.IsNullOrWhiteSpace(command.ClientEmail) || !command.ClientEmail.Contains('@'))
        {
            return new ReservationOutcome(
                ReservationOutcomeStatus.ValidationFailed,
                null,
                "A valid ClientEmail address is required.");
        }

        if (string.IsNullOrWhiteSpace(command.IdempotencyKey) || command.IdempotencyKey.Trim().Length < 6)
        {
            return new ReservationOutcome(
                ReservationOutcomeStatus.ValidationFailed,
                null,
                "Idempotency-Key must be at least 6 characters.");
        }

        // Normalize slot start to exact UTC minute granularity (45-minute private optical salon appointment)
        var normalizedStart = new DateTimeOffset(
            command.SlotStartUtc.UtcDateTime.Year,
            command.SlotStartUtc.UtcDateTime.Month,
            command.SlotStartUtc.UtcDateTime.Day,
            command.SlotStartUtc.UtcDateTime.Hour,
            command.SlotStartUtc.UtcDateTime.Minute,
            0,
            TimeSpan.Zero);

        if (normalizedStart.Minute is not (0 or 30))
        {
            return new ReservationOutcome(
                ReservationOutcomeStatus.ValidationFailed,
                null,
                "Private fitting slots must begin on :00 or :30 UTC boundaries.");
        }

        var normalizedKey = command.IdempotencyKey.Trim();
        var slotKey = $"{boutique.BoutiqueId}|{normalizedStart:O}";
        var preferredSku = string.IsNullOrWhiteSpace(command.PreferredSku)
            ? "MV-EYE-01"
            : command.PreferredSku.Trim().ToUpperInvariant();
        var fingerprint = ComputeFingerprint(
            boutique.BoutiqueId,
            normalizedStart,
            command.ClientEmail.Trim().ToLowerInvariant(),
            preferredSku);

        lock (_gate)
        {
            if (_byIdempotencyKey.TryGetValue(normalizedKey, out var existingByKey))
            {
                if (!string.Equals(existingByKey.Fingerprint, fingerprint, StringComparison.Ordinal))
                {
                    return new ReservationOutcome(
                        ReservationOutcomeStatus.IdempotencyKeyPayloadMismatch,
                        null,
                        "Idempotency-Key was already used for a different fitting slot or client payload.");
                }

                return new ReservationOutcome(
                    ReservationOutcomeStatus.IdempotentReplay,
                    existingByKey.Reservation,
                    null);
            }

            if (_bySlotKey.TryGetValue(slotKey, out var occupied))
            {
                return new ReservationOutcome(
                    ReservationOutcomeStatus.SlotConflict,
                    null,
                    $"Slot {normalizedStart:O} at {boutique.Name} is already reserved (Ref {occupied.ReservationId}).");
            }

            var reservationId = GenerateReservationId(slotKey, normalizedKey);
            var created = new FittingReservation(
                ReservationId: reservationId,
                BoutiqueId: boutique.BoutiqueId,
                BoutiqueName: boutique.Name,
                SlotStartUtc: normalizedStart,
                SlotEndUtc: normalizedStart.AddMinutes(45),
                ClientName: command.ClientName.Trim(),
                ClientEmail: command.ClientEmail.Trim().ToLowerInvariant(),
                PreferredSku: preferredSku,
                Notes: string.IsNullOrWhiteSpace(command.Notes) ? null : command.Notes.Trim(),
                IdempotencyKey: normalizedKey,
                CreatedAtUtc: DateTimeOffset.UtcNow);

            _bySlotKey[slotKey] = created;
            _byIdempotencyKey[normalizedKey] = (fingerprint, created);
            _byReservationId[reservationId] = created;

            return new ReservationOutcome(ReservationOutcomeStatus.Created, created, null);
        }
    }

    public FittingReservation? GetById(string reservationId)
    {
        if (string.IsNullOrWhiteSpace(reservationId)) return null;
        lock (_gate)
        {
            return _byReservationId.GetValueOrDefault(reservationId.Trim());
        }
    }

    public IReadOnlyList<FittingReservation> GetReservedSlots(string boutiqueId)
    {
        lock (_gate)
        {
            return _bySlotKey.Values
                .Where(r => r.BoutiqueId.Equals(boutiqueId.Trim(), StringComparison.OrdinalIgnoreCase))
                .OrderBy(r => r.SlotStartUtc)
                .ToList();
        }
    }

    private static string ComputeFingerprint(
        string boutiqueId,
        DateTimeOffset slotStartUtc,
        string email,
        string preferredSku)
    {
        var raw = $"{boutiqueId}|{slotStartUtc:O}|{email}|{preferredSku}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
        return Convert.ToHexString(hash);
    }

    private static string GenerateReservationId(string slotKey, string idempotencyKey)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{slotKey}|{idempotencyKey}"));
        return $"MVF-{Convert.ToHexString(hash)[..8]}";
    }
}
