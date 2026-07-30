/**
 * `err instanceof ZodError` ISHLATILMAYDI.
 *
 * Monorepoda `packages/shared` va `apps/api` zod'ning turli nusxasini yuklashi mumkin
 * (pnpm ikki xil versiyani ko'rsa alohida o'rnatadi). U holda klass identifikatori
 * mos kelmaydi, `instanceof` jimgina `false` qaytaradi va HAR BIR validatsiya xatosi
 * 400 o'rniga 500 bo'lib ketadi.
 *
 * Shakl bo'yicha tekshirish nusxadan qat'i nazar ishlaydi.
 */
export function isZodError(err) {
  return (
    !!err &&
    (err.name === 'ZodError' || err.constructor?.name === 'ZodError') &&
    Array.isArray(err.issues)
  );
}

/** Zod xatosini bizning `errors` formatimizga o'giradi */
export function zodIssues(err) {
  return err.issues.map((i) => ({
    field: Array.isArray(i.path) ? i.path.join('.') : String(i.path ?? ''),
    message: i.message,
  }));
}

export default isZodError;
