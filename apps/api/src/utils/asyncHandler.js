/**
 * Async controller'larni o'raydi — har birida try/catch yozilmasin.
 * Ishlatilishi: router.get('/', asyncHandler(ctrl.list))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
