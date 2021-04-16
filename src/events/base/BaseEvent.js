class BaseEvent {

  constructor(eventNum, eventPayload) {
    this._eventNum = eventNum;
    this._eventPayload = eventPayload;
  }

  getEventNum() {
    return this._eventNum;
  }

  getEventPayload() {
    return this._eventPayload;
  }

}


module.exports = BaseEvent;