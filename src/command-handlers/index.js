import { APP_CMD } from '@deip/command-models';
import ProjectCmdHandler from './impl/ProjectCmdHandler';
import ProposalCmdHandler from './impl/ProposalCmdHandler';


const map = {
  [APP_CMD.CREATE_PROJECT]: ProjectCmdHandler,
  [APP_CMD.CREATE_PROPOSAL]: ProposalCmdHandler
}

module.exports = map;
