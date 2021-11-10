import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class InvestmentOpportunityCreatedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      investmentOpportunityId,
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

    const checkAsset = (asset, fieldName) => assert(
      !!asset
      && asset.id
      && asset.symbol
      && !isNaN(asset.precision)
      && asset.amount,
      `'${fieldName}' is required and should contains 'id', 'symbol', 'precision', 'amount' fields`
    );

    assert(!!teamId, "'teamId' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!startTime && !isNaN(startTime), "'startTime' required and should be in milliseconds");
    assert(!!endTime && !isNaN(endTime), "'endTime' required and should be in milliseconds");
    assert(new Date(endTime) > new Date(startTime), "'endTime' must be greater than 'startTime'");
    shares.forEach(share => {
      checkAsset(share, 'share')
    })
    checkAsset(softCap, 'softCap')
    checkAsset(hardCap, 'hardCap')

    super(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, {
      investmentOpportunityId,
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