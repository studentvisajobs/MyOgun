export function calculatePriority(
  confidenceScore: number,
  witnessCount: number,
  evidenceCount: number,
  isCritical: boolean
) {
  let score = confidenceScore;

  score += witnessCount * 3;
  score += evidenceCount * 5;

  if (isCritical) {
    score += 30;
  }

  return Math.min(score, 100);
}