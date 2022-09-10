import EventEmitter from 'events';
import { APP_PROPOSAL } from '@casimir.one/platform-core';
import { getSocketServerInstance } from "../../websocket";
import {
  logError,
  logWarn,
  logEventInfo
} from '../../utils/log';


class BaseEventHandler extends EventEmitter {

  constructor() {
    super();
  }

  registered = [];

  isRegistered(eventNum) {
    return this.registered.includes(eventNum);
  }

  register(eventNum, handler) {
    this.registered.push(eventNum);
    this.on(eventNum, (event, ctx, reply) => {
      return BaseEventHandler.PromisifyEventHandler(event, ctx, reply, handler)
    });
  }

  handle(shouldAwait, event, ctx) {
    return new Promise((success, failure) => {
      if (shouldAwait) {
        this.emit(event.getEventNum(), event, ctx, { success, failure });
      } else {
        this.emit(event.getEventNum(), event, ctx);
        success();
      }
    })
      .then(() => {
        logEventInfo(`Event ${event.getEventName()} is handled by ${this.constructor.name} ${event.hasProposalCtx() ? 'within ' + APP_PROPOSAL[event.getProposalCtx().type] + ' flow (' + event.getProposalCtx().proposalId + ')' : ''}`);
      })
      .catch((err) => {
        logError(`Event ${event.getEventName()} ${event.hasProposalCtx() ? 'within ' + APP_PROPOSAL[event.getProposalCtx().type] + ' flow (' + event.getProposalCtx().proposalId + ')' : ''} failed with an error:`, err);
        throw err;
      })
  }

  sendToSockets(event, err) {
    const socketServer = getSocketServerInstance();
    return socketServer.sendEvent(event, err)
  }

  static async PromisifyEventHandler(event, ctx, reply, handler) {
    if (reply) {
      const { success, failure } = reply;
      try {
        const result = await handler(event, ctx);
        success(result);
      } catch (err) {
        failure(err);
      }
    } else {
      handler(event, ctx);
    }
  }

  static async Broadcast(events, ctx) {
    const handlers = this.getHandlers();
    if (!handlers) throw new Error("Cannot find handlers");

    const socketServer = getSocketServerInstance();

    let chain = new Promise((start) => { start() });

    for (let i = 0; i < events.length; i++) {
      const processingErrors = [];
      const event = events[i];
      const eventHandlers = handlers[event.getEventNum()];
      if (!eventHandlers || !eventHandlers.length) {
        logWarn(`WARNING: No event handlers registered for ${event.getEventName()} event`);
        continue;
      }

      for (let j = 0; j < eventHandlers.length; j++) {
        const { h: eventHandler, await: shouldAwait } = eventHandlers[j];
        if (eventHandler.isRegistered(event.getEventNum())) {
          chain = chain.then(() => eventHandler.handle(shouldAwait, event, ctx))
            .catch(err => {
              processingErrors.push({ [eventHandler.constructor.name]: err.message })
            })
        } else {
          logWarn(`WARNING: No event handler registered for ${event.getEventName()} event in ${eventHandler.constructor.name}`);
        }
      }
      chain = chain.then(() => socketServer.sendEvent(event, processingErrors));
    }

    await chain;
  };

}


module.exports = BaseEventHandler;