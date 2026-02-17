export function getBucketQuery(scope, date, periodStart) {
  if (scope === 'daily') return { scope, date };
  if (scope === 'random') return { scope };
  return { scope, periodStart };
}
