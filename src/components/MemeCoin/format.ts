const usdCompactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 2,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const formatUsdCompact = (value: number | null) => {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return '--';
  }

  return usdCompactFormatter.format(value);
};

export const formatCompactNumber = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return compactNumberFormatter.format(value);
};

export const formatAgeFromNow = (timestamp: number, now: number) => {
  if (!timestamp) {
    return '--';
  }

  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  if (diff < minute) {
    return `${Math.floor(diff / 1000)}s`;
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h`;
  }

  return `${Math.floor(diff / day)}d`;
};

export const formatClockTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '--';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const shortMint = (value: string, lead = 4, tail = 4) => {
  if (!value) {
    return '--';
  }

  if (value.length <= lead + tail) {
    return value;
  }

  return `${value.slice(0, lead)}...${value.slice(-tail)}`;
};

export const formatSignedPercent = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) {
    return '--';
  }

  const rounded = Math.round(value);

  if (rounded > 0) {
    return `+${rounded}%`;
  }

  return `${rounded}%`;
};
