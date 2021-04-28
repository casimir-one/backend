import { APP_CMD } from '@deip/command-models';
import projectCmdHandler from './impl/ProjectCmdHandler';
import proposalCmdHandler from './impl/ProposalCmdHandler';
import accountCmdHandler from './impl/AccountCmdHandler';


module.exports = {
  [APP_CMD.CREATE_PROJECT]: projectCmdHandler,
  [APP_CMD.JOIN_PROJECT]: projectCmdHandler,
  [APP_CMD.CREATE_ACCOUNT]: accountCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.UPDATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.DECLINE_PROPOSAL]: proposalCmdHandler
};