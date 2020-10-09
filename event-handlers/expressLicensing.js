import EventEmitter from 'events';
import { APP_EVENTS, EXPRESS_LICENSING_REQUEST_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ExpressLicensingService from './../services/expressLicensing';


class ExpressLicensingHandler extends EventEmitter { }

const expressLicensingHandler = new ExpressLicensingHandler();

expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { licencePlan, researchExternalId } } } = source;
  const expressLicensingService = new ExpressLicensingService();

  const [opName, opPayload, opProposal] = opDatum;

  const { to: researchGroupExternalId } = opPayload;
  const { external_id: externalId, creator: requester, expiration_time: expirationDate } = opProposal;

  const request = await expressLicensingService.createExpressLicensingRequest({
    externalId,
    requester,
    researchExternalId,
    researchGroupExternalId,
    licencePlan,
    expirationDate,
    status: EXPRESS_LICENSING_REQUEST_STATUS.PENDING,
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

  const request = await expressLicensingService.findExpressLicensingRequest(proposalId);

  const approvers = [...request.approvers, ...approvals1, ...approvals2].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const updatedRequest = await expressLicensingService.updateExpressLicensingRequest(proposalId, {
    approvers: approvers,
    status: approvers.some(a => a == request.researchGroupExternalId) && approvers.some(a => a == request.requester) 
      ? EXPRESS_LICENSING_REQUEST_STATUS.APPROVED 
      : request.status
  });

  return updatedRequest;

}));



expressLicensingHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CANCELED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter } } = source;
  const expressLicensingService = new ExpressLicensingService();

  const [opName, opPayload] = opDatum;

  const { external_id: proposalId, account: rejector } = opPayload;

  const request = await expressLicensingService.findExpressLicensingRequest(proposalId);
  const rejectors = [...request.rejectors, rejector, emitter].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const updatedRequest = await expressLicensingService.updateExpressLicensingRequest(proposalId, {
    rejectors: rejectors,
    status: rejectors.some(a => a == request.researchGroupExternalId) || rejectors.some(a => a == request.requester)
      ? EXPRESS_LICENSING_REQUEST_STATUS.REJECTED
      : request.status
  });


  return updatedRequest;

}));





export default expressLicensingHandler;