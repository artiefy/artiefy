export const formatScore = (score: number): string => {
	const formattedScore = score.toFixed(2);
	// Remove trailing zeros after decimal point, but keep one decimal if it ends in .0
	return formattedScore.replace(/\.?0+$/, '').replace(/(\.\d)0$/, '$1');
};

export const formatScoreNumber = (score: number): number => {
	// Always return number with 2 decimal places
	return Number(score.toFixed(2));
};
