import { describe, expect, it } from 'vitest';
import {
  deliveryFormSchema,
  generateDeterministicOrderId,
  paymentFormSchema,
} from '../checkoutSchema';

describe('checkout Zod validation & deterministic order reference generator', () => {
  it('validates complete concierge delivery payload and rejects invalid email', () => {
    const valid = deliveryFormSchema.safeParse({
      fullName: 'Truong Van Tinh',
      email: 'client@maison-vera.paris',
      phone: '+84 931 467 024',
      address: '14 Rue des Francs-Bourgeois',
      city: 'Paris',
      country: 'France',
      postalCode: '75003',
    });
    expect(valid.success).toBe(true);

    const invalid = deliveryFormSchema.safeParse({
      fullName: 'A',
      email: 'not-an-email',
      phone: '123',
      address: '1',
      city: '',
      country: '',
      postalCode: '',
    });
    expect(invalid.success).toBe(false);
  });

  it('validates Card, Apple Pay Express, and B2B Invoice payment methods', () => {
    expect(
      paymentFormSchema.safeParse({
        method: 'apple-pay',
      }).success
    ).toBe(true);

    expect(
      paymentFormSchema.safeParse({
        method: 'b2b-invoice',
        b2bVatId: 'FR84910283741',
      }).success
    ).toBe(true);

    expect(
      paymentFormSchema.safeParse({
        method: 'card',
        cardNumber: '4242 4242 4242 4242',
        cardHolder: 'TRUONG VAN TINH',
        cardExpiry: '11/29',
        cardCvc: '842',
      }).success
    ).toBe(true);

    expect(
      paymentFormSchema.safeParse({
        method: 'card',
        cardNumber: '1234',
        cardHolder: '',
        cardExpiry: '99/99',
        cardCvc: '1',
      }).success
    ).toBe(false);
  });

  it('mints deterministic MV-2026-XXXX order references', () => {
    const idA = generateDeterministicOrderId('client@maison-vera.paris|2550|VERA15');
    const idB = generateDeterministicOrderId('client@maison-vera.paris|2550|VERA15');
    const idC = generateDeterministicOrderId('other@maison-vera.paris|480|NONE');

    expect(idA).toMatch(/^MV-2026-[A-Z0-9]{4}$/);
    expect(idA).toBe(idB);
    expect(idA).not.toBe(idC);
  });
});
