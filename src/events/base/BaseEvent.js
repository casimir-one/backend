import APP_EVENT from './AppEvent';

class BaseEvent {

  constructor(eventNum, eventPayload) {
    this._eventNum = eventNum;
    this._eventPayload = eventPayload;
    this._proposalCtx = eventPayload.proposalCtx || null;
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

}


module.exports = BaseEvent;