import { APP_EVENT, DOMAIN_EVENT } from '@casimir/platform-core';

class BaseEvent {

  constructor(eventNum, eventPayload) {
    this._eventNum = eventNum;
    this._eventPayload = eventPayload;
    this._proposalCtx = eventPayload.proposalCtx || null;
    this._timestamp = Date.now();
    this._txInfo = eventPayload.txInfo || null;
  }

  getEventNum() {
    return this._eventNum;
  }

  getEventName() {
    return APP_EVENT[this._eventNum] || DOMAIN_EVENT[this._eventNum];
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

  setEventIssuer(username) {
    this._eventIssuer = username;
  }

  getEventIssuer() {
    return this._eventIssuer;
  }

  setTxInfo(txInfo) {
    this._txInfo = txInfo;
  }
  getTxInfo() {
    return this._txInfo;
  }

  setAssociatedEvents(events) {
    this._associatedEvents = events;
  }

  getAssociatedEvents() {
    return this._associatedEvents;
  }

  toString() {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      eventNum: this.getEventNum(),
      eventName: this.getEventName(),
      eventPayload: this.getEventPayload(),
      eventIssuer: this.getEventIssuer(),
      txInfo: this.getTxInfo(),
      proposalCtx: this.getProposalCtx(),
      associatedEvents: this.getAssociatedEvents() && this.getAssociatedEvents().map(x => x.toString()),
    });

  }

}


module.exports = BaseEvent;