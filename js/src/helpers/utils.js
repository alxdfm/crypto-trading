export function minimalOperation(price) {
  const min = 12 / Number(price);
  console.log(min, price);
  return String(min.toFixed(5));
}
