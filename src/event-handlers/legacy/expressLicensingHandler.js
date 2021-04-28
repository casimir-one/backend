import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, PROPOSAL_STATUS } from './../../constants';
import { handle, fire, wait } from './utils';
import ExpressLicensingService from './../../services/expressLicensing';
import ProposalService from './../../services/impl/read/ProposalDtoService';

class ExpressLicensingHandler extends EventEmitter { }

const expressLicensingHandler = new ExpressLicensingHandler();


expressLicensingHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;

  const proposalsService = new ProposalService();
  const expressLicensingService = new ExpressLicensingService();

  const proposalId = researchExpressLicenseProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  if (proposal.proposal.status == PROPOSAL_STATUS.APPROVED) {
    await expressLicensingService.createExpressLicense({
      externalId: proposal.details.licenseExternalId,
      requestId: proposal.proposal.external_id,
      owner: proposal.details.licensee,
      licenser: proposal.details.licenser,
      researchExternalId: proposal.details.researchExternalId,
      licensePlan: proposal.details.licensePlan
    });
  }

}));



export default expressLicensingHandler;