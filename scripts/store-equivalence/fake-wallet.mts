// Only the pure wallet helpers used by actions/selectors are needed here.

export const parseBalance = (value) => {
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const formatWalletBalance = (balanceInput, symbol = '$') => {
  const balanceStr = typeof balanceInput === 'number' ? balanceInput.toString() : balanceInput;
  let parsedBalance;
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(balanceStr.trim())) {
    parsedBalance = parseFloat(balanceStr);
  } else {
    const cleaned = balanceStr.replace(/[^0-9.-]/g, '');
    parsedBalance = parseFloat(cleaned);
  }
  if (Number.isNaN(parsedBalance)) parsedBalance = 0;

  const isNegative = parsedBalance < 0;
  const formattedNumber = Math.abs(parsedBalance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `-${symbol}${formattedNumber}` : `${symbol}${formattedNumber}`;
};

export const deserializeAccount = (data) => ({ ...data, icon: undefined });
