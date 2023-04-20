export function minimalOperation(price) {
  const min = 11 / price;
  return String(min.toFixed(6));
}
