import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class InvestmentOpportunityParticipatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      investmentOpportunityId,
      investor,
      asset
    } = eventPayload;

    assert(!!investmentOpportunityId, "'investmentOpportunityId' is required");
    assert(!!investor, "'investor' is required");
    assert(
      !!asset
      && asset.id
      && asset.symbol
      && !isNaN(asset.precision)
      && asset.amount,
      "'asset' is required and should contains 'id', 'symbol', 'precision', 'amount' fields"
    )

    super(APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED, eventPayload);
  }

}


module.exports = InvestmentOpportunityParticipatedEvent;