import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class ContractAgreementProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectNdaCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const {
      entityId: contractAgreementId,
      creator,
      parties,
      hash,
      startTime,
      endTime,
      type,
      terms,
      projectId,
      licenser,
      termsHash,
      fee
    } = createProjectNdaCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!contractAgreementId, "'contractAgreementId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 1, "'parties' is required");
    assert(!!type, "'type' is required");
    assert(!!terms, "'terms' is required");
    assert(startTime ? new Date(endTime) > new Date(startTime) : new Date(endTime) > new Date(), "'endTime' must be greater than current time or 'startTime'");

    super(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_ACCEPTED, {
      proposalId,
      expirationTime,
      contractAgreementId,
      creator,
      parties,
      hash,
      startTime,
      endTime,
      type,
      terms,
      proposalCtx
    });

  }

}


module.exports = ContractAgreementProposalAcceptedEvent;