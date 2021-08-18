import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectTokenSaleInvestedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      tokenSaleId,
      investor,
      amount
    } = eventPayload;

    assert(!!tokenSaleId, "'tokenSaleId' is required");
    assert(!!investor, "'investor' is required");
    assert(!!amount, "'amount' required");

    super(APP_EVENT.PROJECT_TOKEN_SALE_INVESTED, eventPayload);
  }

}


module.exports = ProjectTokenSaleInvestedEvent;