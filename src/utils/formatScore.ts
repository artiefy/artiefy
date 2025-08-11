export const formatScore = (score: number): string => {
  const formattedScore = score.toFixed(2);
  if (formattedScore.endsWith("00")) {
    return score.toFixed(1); // For scores like 5.00 -> "5.0"
  }
  if (formattedScore.endsWith("0")) {
    return formattedScore.slice(0, -1); // For scores like 5.40 -> "5.4"
  }
  return formattedScore; // For scores like 5.45 -> "5.45"
};

export const formatScoreNumber = (score: number): number => {
  // Always return number with 2 decimal places
  return Number(score.toFixed(2));
};
