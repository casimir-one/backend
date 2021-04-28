import { APP_PROPOSAL } from '@deip/command-models';
import ProjectInviteCreatedEvent from './../impl/ProjectInviteCreatedEvent';
import ProjectProposalCreatedEvent from './../impl/ProjectProposalCreatedEvent';


module.exports = {
  [APP_PROPOSAL.PROJECT_INVITE_PROPOSAL]: ProjectInviteCreatedEvent,
  [APP_PROPOSAL.PROJECT_PROPOSAL]: ProjectProposalCreatedEvent
}