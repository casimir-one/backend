import { APP_CMD } from '@deip/command-models';
import projectCmdHandler from './impl/ProjectCmdHandler';
import proposalCmdHandler from './impl/ProposalCmdHandler';


const MAP = {
  [APP_CMD.CREATE_PROJECT]: projectCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: proposalCmdHandler
}

module.exports = MAP;
