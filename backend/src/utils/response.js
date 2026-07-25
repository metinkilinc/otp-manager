/**
 * Standart API Response Helper
 * Başarılı: { success: true, data: { ... } }
 * Hatalı:   { success: false, error: { code: "KOD", message: "Mesaj" } }
 */

function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function error(res, code, message, statusCode = 400, extra = {}) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message, ...extra },
  });
}

module.exports = { success, error };
