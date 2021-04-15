import BaseController from './base/BaseController';
import ProjectForm from './../forms/projectForm';
import protocolTxCmdHandler from './../command-handlers/impl/ProtocolTxCmdHandler';


class ProjectsController extends BaseController {

  createProject = this.actionForm(ProjectForm, async (ctx) => {
    const appCmd = ctx.state.appCmd;
    const txInfo = await protocolTxCmdHandler.handle(appCmd, ctx);

    ctx.status = 200;
    ctx.body = { model: "ok" };

  });
  
}

const projectsCtrl = new ProjectsController();

module.exports = projectsCtrl;