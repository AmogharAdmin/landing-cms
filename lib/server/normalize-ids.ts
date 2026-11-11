/** PostgreSQL bigint values often arrive as strings — coerce before delete queries. */
export function normalizeRecordIds(ids: Array<number | string | unknown>) {
  return [...new Set(
    ids
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0),
  )];
}
