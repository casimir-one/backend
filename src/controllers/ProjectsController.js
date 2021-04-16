import BaseController from './base/BaseController';
import ProjectForm from './../forms/ProjectForm';
import protocolTxCmdHandler from './../command-handlers/impl/ProtocolTxCmdHandler';


class ProjectsController extends BaseController {

  createProject = this.command({
    form: ProjectForm, h: async (ctx) => {
      try {
        const appCmd = ctx.state.appCmd;
        const txInfo = await protocolTxCmdHandler.handle(appCmd, ctx);

        ctx.status = 200;
        ctx.body = { model: "ok" };

      } catch (err) {
        ctx.status = 500;
        ctx.body = ["error1"];
      }
    }
  });
  
}


const projectsCtrl = new ProjectsController();


module.exports = projectsCtrl;