// Create a new utility for handling sensitive data
export const maskSensitiveValue = (value, showChars = 4) => {
  if (!value) return '';
  const visible = value.slice(0, showChars);
  const masked = '*'.repeat(value.length - showChars);
  return visible + masked;
};

export const logSensitive = (label, value) => {
  console.log(`${label}: ${maskSensitiveValue(value)}`);
}; 