import BaseController from './base/BaseController';
import ProjectForm from './../forms/projectForm';
import { CreateProposalCmd, APP_CMD_INFO } from '@deip/command-models';
import { GrapheneTx } from '@deip/command-models';
import { MultipartFormDataRequest, ApplicationJsonRequest } from '@deip/request-models';
import projectCmdHandler from './../command-handlers/ProjectCmdHandler';
import protocolTxCmdHandler from './../command-handlers/ProtocolTxCmdHandler';


class ProjectsController extends BaseController {

  createProject = this.actionForm(ProjectForm, async (ctx) => {
    const appCmd = ctx.state.appCmd;
    const txInfo = await protocolTxCmdHandler.handle(appCmd, ctx);

    ctx.status = 200;
    ctx.body = { model: "ok" };

  });
  
}

const projectsCtrl = new ProjectsController();

export default projectsCtrl;