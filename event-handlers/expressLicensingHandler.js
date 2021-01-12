import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ExpressLicensingService from './../services/expressLicensing';
import ResearchGroupService from './../services/researchGroup';
import ProposalService from './../services/proposal';
import usersService from './../services/users';

class ExpressLicensingHandler extends EventEmitter { }

const expressLicensingHandler = new ExpressLicensingHandler();


expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);
  const expressLicensingService = new ExpressLicensingService(proposalsService, usersService, researchGroupService);

  const proposalId = researchExpressLicenseProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  if (proposal.proposal.status == PROPOSAL_STATUS.APPROVED) {
    await expressLicensingService.createExpressLicense({
      externalId: proposal.details.licenseExternalId,
      requestId: proposal.proposal.external_id,
      owner: proposal.details.licensee,
      licenser: proposal.details.licenser,
      researchExternalId: proposal.details.researchExternalId,
      licencePlan: proposal.details.licencePlan
    });
  }

}));



export default expressLicensingHandler;