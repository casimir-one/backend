import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class InvestmentOpportunityParticipatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      tokenSaleId,
      investor,
      amount
    } = eventPayload;

    assert(!!tokenSaleId, "'tokenSaleId' is required");
    assert(!!investor, "'investor' is required");
    assert(!!amount, "'amount' required");

    super(APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED, eventPayload);
  }

}


module.exports = InvestmentOpportunityParticipatedEvent;