import { APP_CMD } from '@deip/command-models';
import projectCmdHandler from './impl/ProjectCmdHandler';
import proposalCmdHandler from './impl/ProposalCmdHandler';


module.exports = {
  [APP_CMD.CREATE_PROJECT]: projectCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: proposalCmdHandler,
  [APP_CMD.JOIN_PROJECT]: projectCmdHandler
};