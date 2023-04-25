export function minimalOperation(price) {
  const min = 12 / Number(price);
  return String(min.toFixed(5));
}
