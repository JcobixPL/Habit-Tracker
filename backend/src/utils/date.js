export function toISODateOnly(date) {
  const d = new Date(date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfUTCDate(isoDate) {
  // isoDate: YYYY-MM-DD
  return new Date(`${isoDate}T00:00:00.000Z`);
}
