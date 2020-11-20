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

expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { offchainMeta: { licencePlan } } } = source;
  const [opName, opPayload, opProposal] = opDatum;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);
  const expressLicensingService = new ExpressLicensingService(proposalsService, usersService, researchGroupService);

  const { external_id: licenseExternalId, research_external_id: researchExternalId, licensee: requester } = opPayload;
  const { external_id: proposalId } = opProposal;

  const proposalRef = await expressLicensingService.createExpressLicenseRequest(proposalId, {
    requester,
    researchExternalId,
    licenseExternalId,
    licencePlan
  })

  return proposalRef;
}));



expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { txInfo } } } = source;
  const [opName, opPayload] = opDatum;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);
  const expressLicensingService = new ExpressLicensingService(proposalsService, usersService, researchGroupService);

  const { external_id: proposalId, active_approvals_to_add: approvals1, owner_approvals_to_add: approvals2 } = opPayload;

  const request = await expressLicensingService.getExpressLicensingRequest(proposalId);
  const mapedProposal = await proposalsService.getProposal(proposalId);

  if (mapedProposal.proposal.status == PROPOSAL_STATUS.APPROVED) {
    await expressLicensingService.createExpressLicense({
      requestId: request._id,
      externalId: request.details.licenseExternalId,
      owner: request.details.requester,
      researchExternalId: request.details.researchExternalId,
      licencePlan: request.details.licencePlan
    });
  }

}));


expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CANCELED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { txInfo } } } = source;
  const [opName, opPayload] = opDatum;

  const { external_id: proposalId, account: rejector } = opPayload;
}));



export default expressLicensingHandler;