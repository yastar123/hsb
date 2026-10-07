import { describe, expect, it } from 'vitest';
import { buildIllustrativeHistory, products, simulatedTickMove, simulatePriceTick } from '@/lib/market-data';

describe('simulated market prices', () => {
  it('produces different movement sequences for different symbols', () => {
    const gold = Array.from({ length: 8 }, (_, index) => simulatedTickMove('XAUUSD', index + 1));
    const euro = Array.from({ length: 8 }, (_, index) => simulatedTickMove('EURUSD', index + 1));
    expect(gold).not.toEqual(euro);
  });

  it('changes a quote by its symbol-specific price precision', () => {
    const gold = products.find((product) => product.symbol === 'XAUUSD');
    const euro = products.find((product) => product.symbol === 'EURUSD');
    expect(gold).toBeDefined();
    expect(euro).toBeDefined();
    expect(simulatePriceTick(gold!, gold!.ask, 1)).not.toBe(gold!.ask);
    expect(simulatePriceTick(euro!, euro!.ask, 1)).not.toBe(euro!.ask);
    const nextEuroPrice = simulatePriceTick(euro!, euro!.ask, 1);
    expect(Number(nextEuroPrice.toFixed(euro!.decimals))).toBe(nextEuroPrice);
  });

  it('builds a distinct, stable illustrative chart for every market symbol', () => {
    const histories = products.map((product) => buildIllustrativeHistory(product, '1m', 1_800_000_000_000));
    const signatures = new Set(histories.map((history) => history.map((candle) => candle.close).join(',')));

    expect(signatures.size).toBe(products.length);
    expect(histories.every((history) => history.length === 90)).toBe(true);
    expect(histories.every((history, index) => history.at(-1)?.close === products[index]?.ask)).toBe(true);
    expect(buildIllustrativeHistory(products[0]!, '1m', 1_800_000_000_000)).toEqual(histories[0]);
  });
});
