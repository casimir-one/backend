import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class InvestmentOpportunityCreatedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      tokenSaleId,
      teamId,
      projectId,
      startTime,
      endTime,
      shares,
      softCap,
      hardCap,
      creator,
      title,
      metadata
    } = eventPayload;

    assert(!!teamId, "'teamId' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!startTime, "'startTime' required");
    assert(!!endTime, "'endTime' required");
    assert(new Date(endTime) > new Date(startTime), "'endTime' must be greater than 'startTime'");
    assert(!!shares, "'shares' required");
    assert(!!softCap, "'softCap' required");
    assert(!!hardCap, "'hardCap' required");

    super(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, {
      tokenSaleId,
      teamId,
      projectId,
      startTime,
      endTime,
      shares,
      softCap,
      hardCap,
      creator,
      title,
      metadata
    });
  }
}


module.exports = InvestmentOpportunityCreatedEvent;