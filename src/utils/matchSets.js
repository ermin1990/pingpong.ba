const parseNonNegativeInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeSetValue = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 0 ? 0 : parsed;
};

export const sanitizeMatchSets = (sets = [], player1Score = 0, player2Score = 0) => {
  const s1 = parseNonNegativeInt(player1Score);
  const s2 = parseNonNegativeInt(player2Score);
  const totalPlayedSets = s1 + s2;

  if (totalPlayedSets <= 0) return [];

  return Array.from({ length: totalPlayedSets }, (_, idx) => {
    const set = sets[idx] || {};
    return {
      p1: normalizeSetValue(set.p1),
      p2: normalizeSetValue(set.p2)
    };
  });
};
