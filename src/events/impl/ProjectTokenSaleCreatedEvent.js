import BaseEvent from './../base/BaseEvent';
import { APP_PROPOSAL } from '@deip/command-models';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectTokenSaleCreatedEvent extends BaseEvent {
  constructor(eventPayload) {
    const qwe = eventPayload;

    const {
      teamId,
      projectId,
      startTime,
      endTime,
      securityTokensOnSale,
      softCap,
      hardCap,
      creator
    } = eventPayload;

    assert(!!teamId, "'teamId' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!startTime, "'startTime' required");
    assert(!!endTime, "'endTime' required");
    assert(new Date(endTime) > new Date(startTime), "'endTime' must be greater than 'startTime'");
    assert(!!securityTokensOnSale, "'securityTokensOnSale' required");
    assert(!!softCap, "'softCap' required");
    assert(!!hardCap, "'hardCap' required");

    super(APP_EVENT.PROJECT_TOKEN_SALE_CREATED, { 
      teamId,
      projectId,
      startTime,
      endTime,
      securityTokensOnSale,
      softCap,
      hardCap,
      creator
    });
  }
}


module.exports = ProjectTokenSaleCreatedEvent;