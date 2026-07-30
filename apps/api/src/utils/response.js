/**
 * Javob formati loyihada BIR XIL:
 *   { success: true, data, meta? }
 *   { success: false, message, code }
 */

export function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function noContent(res) {
  return res.status(204).end();
}

/** Pagination meta yasash */
export function paginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}
