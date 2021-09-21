
import EventEmitter from 'events';
import { handle, fire, wait } from './utils';
import { LEGACY_APP_EVENTS } from './../../constants';
import userNotificationsHandler from './userNotificationHandler';
import researchHandler from './researchHandler';
import expressLicensingHandler from './expressLicensingHandler';
import proposalHandler from './proposalHandler';
import config from './../../config';
import { ChainService } from '@deip/chain-service';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

appEventHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposedEvent } = source;
  await wait(proposalHandler, userResignationProposedEvent);
  fire(userNotificationsHandler, userResignationProposedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposalSignedEvent, tenant } = source;
  fire(researchHandler, userResignationProposalSignedEvent, null, tenant);
  fire(userNotificationsHandler, userResignationProposalSignedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposedEvent, tenant } = source;
  await wait(proposalHandler, researchExpressLicenseProposedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;
  await wait(expressLicensingHandler, researchExpressLicenseProposalSignedEvent, null, tenant);
}));

export default appEventHandler;