const getBucketQuery = (userId, scope, date, periodStart) => {
  if (scope === 'daily') {
    return { userId, scope: 'daily', date: new Date(date) };
  } else {
    return { userId, scope: { $ne: 'daily' }, periodStart: new Date(periodStart) };
  }
};

module.exports = { getBucketQuery };
