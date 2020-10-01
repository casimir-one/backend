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

function fire(handler, eventName, event) {
  handler.emit(eventName, { ...event });
}

async function wait(handler, eventName, event) {
  const promise = new Promise((resolve, reject) => {
    handler.emit(eventName, { ...event }, { success: resolve, failure: reject });
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