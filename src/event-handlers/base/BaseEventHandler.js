import EventEmitter from 'events';
import { APP_PROPOSAL } from '@deip/command-models';
import {
  logError,
  logWarn,
  logEventInfo
 } from './../../utils/log';


class BaseEventHandler extends EventEmitter {

  constructor() {
    super();
  }

  register(eventNum, handler) {
    this.on(eventNum, (event, ctx, reply) => {
      return BaseEventHandler.PromisfyEventHandler(event, ctx, reply, handler)
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
      });
  }


  static async PromisfyEventHandler(event, ctx, reply, handler) {
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
    const APP_EVENT_HANDLERS = require('./../../event-handlers');

    let chain = new Promise((start) => { start() });

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventHandlers = APP_EVENT_HANDLERS[event.getEventNum()];
      if (!eventHandlers || !eventHandlers.length) {
        logWarn(`WARNING: No event handlers registered for ${event.getEventName()} event`);
        continue;
      }

      for (let j = 0; j < eventHandlers.length; j++) {
        const { h: eventHandler, await: shouldAwait } = eventHandlers[j];
        chain = chain.then(() => eventHandler.handle(shouldAwait, event, ctx));
      }
    }

    await chain;
  };

}


module.exports = BaseEventHandler;