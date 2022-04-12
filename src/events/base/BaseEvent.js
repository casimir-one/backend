import { APP_EVENT } from '@deip/constants';

class BaseEvent {

  constructor(eventNum, eventPayload) {
    this._eventNum = eventNum;
    this._eventPayload = eventPayload;
    this._proposalCtx = eventPayload.proposalCtx || null;
    this._timestamp = Date.now();
    this._eventIssuer = null;
  }

  getEventNum() {
    return this._eventNum;
  }

  getEventName() {
    return APP_EVENT[this._eventNum];
  }

  getEventPayload() {
    return this._eventPayload;
  }

  getProposalCtx() {
    return this._proposalCtx;
  }

  hasProposalCtx() {
    return !!this._proposalCtx;
  }

  getTimestamp() {
    return this._timestamp;
  }

  setEventIssuer(ctx) {
    const issuer = ctx.state.user;
    this._eventIssuer = issuer?.username;
  }

  getEventIssuer() {
    return this._eventIssuer;
  }

  toString() {
    return JSON.stringify({ 
      timestamp: this.getTimestamp(), 
      eventNum: this.getEventNum(), 
      eventName: this.getEventName(), 
      eventPayload: this.getEventPayload(),
      eventIssuer: this.getEventIssuer(),
      proposalCtx: this.getProposalCtx()
    });

  }

}


module.exports = BaseEvent;