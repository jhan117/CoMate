function isIntegerId(value) {
  const str = String(value ?? '').trim();
  return (
    /^\d+$/.test(str) &&
    Number(str) >= 1 &&
    Number(str) <= 2147483647
  );
}

module.exports = { isIntegerId };
