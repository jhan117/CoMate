function isIntegerId(value) {
  const str = String(value ?? '').trim();
  return (
    /^\d+$/.test(str) &&
    Number(str) >= 1 &&
    Number(str) <= 2147483647
  );
}

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

module.exports = { isIntegerId, cleanText, toIsoString };
