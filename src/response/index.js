const makeDefaultResponse = ({ data, error }) => {
  const dataInfo = {};
  if (data) {
    dataInfo.data = data;
  }
  if (error) {
    dataInfo.error = error;
  }
  return {
    apiVersion: 'v2',
    ...dataInfo
  }
}

const errorRes = (ctx) => (err, {
  errors = [],
  extraInfo = {}
} = {}) => {
  ctx.status = err.httpStatus || err.status || 500;
  ctx.body = makeDefaultResponse({
    error: {
      name: err.name,
      message: err.message,
      ...extraInfo,
      errors
    }
  });
}

const successRes = (ctx) => (data = {}, {
  extraInfo = {},
  withoutWrap = false, // only for files
  status = 200
} = {}) => {
  if (withoutWrap) {
    ctx.status = status;
    ctx.body = data;
  } else {
    const resData = {};
    if (Array.isArray(data)) {
      resData.data = {
        items: data,
        ...extraInfo
      }
    } else {
      resData.data = {
        ...data,
        ...extraInfo
      }
    }

    ctx.status = status;
    ctx.body = makeDefaultResponse(resData);
  }
}

const jsonResponse = () => async(ctx, next) => {
  ctx.successRes = successRes(ctx)
  ctx.errorRes = errorRes(ctx)
  await next()
}

module.exports = jsonResponse