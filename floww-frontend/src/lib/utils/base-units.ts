/** Decimal strings only: never round token amounts through Number. */
export function toBaseUnits(amount: string, decimals = 6): string {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    !/^(0|[1-9]\d*)(\.\d+)?$/.test(amount)
  )
    throw new RangeError("INVALID_AMOUNT");
  const [whole, fraction = ""] = amount.split(".");
  if (fraction.length > decimals) throw new RangeError("AMOUNT_PRECISION");
  return BigInt(whole + fraction.padEnd(decimals, "0")).toString();
}
export function fromBaseUnits(units: string, decimals = 6): string {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    !/^(0|[1-9]\d*)$/.test(units)
  )
    throw new RangeError("INVALID_AMOUNT");
  if (!decimals) return units;
  const padded = units.padStart(decimals + 1, "0");
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return padded.slice(0, -decimals) + (fraction ? "." + fraction : "");
}
