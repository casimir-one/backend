import BaseEvent from './../base/BaseEvent';
import { APP_PROPOSAL } from '@deip/constants';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectTokenSaleProposalDeclinedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.INVESTMENT_OPPORTUNITY_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.INVESTMENT_OPPORTUNITY_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectTokenSaleCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const {
      teamId,
      projectId,
      startTime,
      endTime,
      shares,
      softCap,
      hardCap,
      creator
    } = createProjectTokenSaleCmd.getCmdPayload();
    
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!projectId, `'projectId' is required`);
    assert(!!teamId, `'teamId' is required`);
    assert(!!startTime, `'startTime' is required`);
    assert(!!endTime, `'endTime' is required`);
    assert(new Date(endTime) > new Date(startTime), "'endTime' must be greater than 'startTime'");
    assert(!!shares, `'shares' is required`);
    assert(!!softCap, `'softCap' is required`);
    assert(!!hardCap, `'hardCap' is required`);

    super(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_DECLINED, { 
      proposalId, 
      expirationTime,
      teamId,
      projectId,
      startTime,
      endTime,
      shares,
      softCap,
      hardCap,
      proposalCtx,
      creator
    });
  }

}


module.exports = ProjectTokenSaleProposalDeclinedEvent;