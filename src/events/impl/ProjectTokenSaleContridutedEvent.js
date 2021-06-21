import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectTokenSaleContridutedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      tokenSaleId,
      contributor,
      amount
    } = eventPayload;

    assert(!!tokenSaleId, "'tokenSaleId' is required");
    assert(!!contributor, "'contributor' is required");
    assert(!!amount, "'amount' required");

    super(APP_EVENT.PROJECT_TOKEN_SALE_CONTRIBUTED, eventPayload);
  }

}


module.exports = ProjectTokenSaleContridutedEvent;