async function handle(payload, reply, handler) {
  if (reply) {
    const { success, failure } = reply;
    try {
      const result = await handler(payload);
      success(result);
    } catch (err) {
      failure(err);
    }
  } else {
    handler(payload);
  }
}

function fire(handler, event, payload, tenant) {
  if (typeof event === 'string') { // legacy
    handler.emit(event, { ...payload });
  } else {
    handler.emit(event.getAppEventName(), { event, tenant });
  }
}

async function wait(handler, event, payload, tenant) {
  const promise = new Promise((resolve, reject) => {
    if (typeof event === 'string') { // legacy
      handler.emit(event, { ...payload }, { success: resolve, failure: reject });
    } else {
      handler.emit(event.getAppEventName(), { event, tenant }, { success: resolve, failure: reject });
    }
  });

  try {
    const result = await promise;
    return result;
  } catch(err) {
    throw Error(err);
  }
}

export {
  handle,
  fire,
  wait
}