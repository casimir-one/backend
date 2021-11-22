import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class ContractAgreementProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectNdaCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime: proposalExpirationTime } = proposalCmd.getCmdPayload();
    const {
      entityId: contractAgreementId,
      creator,
      parties,
      hash,
      activationTime,
      expirationTime,
      type,
      terms,
      projectId,
      licenser,
      termsHash,
      price,
      pdfContent
    } = createProjectNdaCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!proposalExpirationTime, `Proposal 'expirationTime' is required`);
    assert(!!contractAgreementId, "'contractAgreementId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 1, "'parties' is required");
    assert(!!type, "'type' is required");
    assert(!!terms, "'terms' is required");

    if (expirationTime && activationTime) {
      assert(new Date(expirationTime) > new Date(activationTime), "'expirationTime' must be greater than 'activationTime'");
    } else if (expirationTime) {
      assert(new Date(expirationTime) > new Date(), "'expirationTime' must be greater than current time");
    } else if (activationTime) {
      assert(new Date(activationTime) > new Date(), "'activationTime' must be greater than current time");
    }

    super(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, {
      proposalId,
      proposalExpirationTime,
      contractAgreementId,
      creator,
      parties,
      hash,
      activationTime,
      expirationTime,
      type,
      terms,
      pdfContent,
      proposalCtx
    });

  }

}


module.exports = ContractAgreementProposalCreatedEvent;