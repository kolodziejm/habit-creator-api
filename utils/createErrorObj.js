const createErrorObj = arr => {
  const errObj = {};
  arr.map(err => {
    const errParam = err.param;
    return {
      [errParam]: err.msg
    }
  }).reduce((prev, curr, i, arr) => {
    const key = Object.keys(curr);
    const value = curr[key];
    errObj[key] = value;
  }, {});
  return errObj;
};

module.exports = createErrorObj;