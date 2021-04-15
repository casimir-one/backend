import EventEmitter from 'events';


class BaseCmdHandler extends EventEmitter {

  constructor() {
    super();
  }

  register(cmdNum, handler) {
    this.on(cmdNum, (cmd, ctx, reply) => {
      return this.promisfyHandler(cmd, ctx, reply, handler)
    });
  }

  handle(cmd, ctx) {
    return new Promise((success, failure) => {
      this.emit(cmd.getCmdNum(), cmd, ctx, { success, failure });
    });
  }

  async promisfyHandler(cmd, ctx, reply, handler) {
    if (reply) {
      const { success, failure } = reply;
      try {
        const result = await handler(cmd, ctx);
        success(result);
      } catch (err) {
        failure(err);
      }
    } else {
      handler(cmd, ctx);
    }
  }

}


module.exports = BaseCmdHandler;