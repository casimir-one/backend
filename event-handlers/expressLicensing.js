import EventEmitter from 'events';
import { APP_EVENTS, EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ExpressLicensingService from './../services/expressLicensing';
import deipRpc from '@deip/rpc-client';

class ExpressLicensingHandler extends EventEmitter { }

const expressLicensingHandler = new ExpressLicensingHandler();

expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { licencePlan, researchExternalId } } } = source;
  const expressLicensingService = new ExpressLicensingService();

  const [opName, opPayload, opProposal] = opDatum;

  const { to: researchGroupExternalId } = opPayload;
  const { external_id: externalId, creator: requester, expiration_time: expirationDate } = opProposal;

  const request = await expressLicensingService.createExpressLicenseRequest({
    externalId,
    requester,
    researchExternalId,
    researchGroupExternalId,
    licencePlan,
    expirationDate,
    status: EXPRESS_LICENSE_REQUEST_STATUS.PENDING,
    approvers: [],
    rejectors: []
  })

  return request;

}));



expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter } } = source;
  const expressLicensingService = new ExpressLicensingService();

  const [opName, opPayload] = opDatum;

  const { external_id: proposalId, active_approvals_to_add: approvals1, owner_approvals_to_add: approvals2 } = opPayload;

  const request = await expressLicensingService.getExpressLicensingRequest(proposalId);
  const approvers = [...request.approvers, ...approvals1, ...approvals2].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const chainProposal = await deipRpc.api.getProposalAsync(proposalId);
  const status = !chainProposal
    ? EXPRESS_LICENSE_REQUEST_STATUS.APPROVED 
    : request.status;

  const updatedRequest = await expressLicensingService.updateExpressLicensingRequest(proposalId, {
    approvers: approvers,
    status: status
  });

  if (status == EXPRESS_LICENSE_REQUEST_STATUS.APPROVED) {
    await expressLicensingService.createExpressLicense({
      requestId: request._id,
      owner: request.requester,
      researchExternalId: request.researchExternalId,
      researchGroupExternalId: request.researchGroupExternalId,
      licencePlan: request.licencePlan
    });
  }

  return updatedRequest;

}));



expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CANCELED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter } } = source;
  const expressLicensingService = new ExpressLicensingService();

  const [opName, opPayload] = opDatum;

  const { external_id: proposalId, account: rejector } = opPayload;

  const request = await expressLicensingService.getExpressLicensingRequest(proposalId);
  const rejectors = [...request.rejectors, rejector, emitter].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const chainProposal = await deipRpc.api.getProposalAsync(proposalId);
  const status = !chainProposal
    ? EXPRESS_LICENSE_REQUEST_STATUS.REJECTED
    : request.status;

  const updatedRequest = await expressLicensingService.updateExpressLicensingRequest(proposalId, {
    rejectors: rejectors,
    status: status
  });

  return updatedRequest;

}));





export default expressLicensingHandler;