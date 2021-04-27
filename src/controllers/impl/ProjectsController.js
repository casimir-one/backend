import BaseController from './../base/BaseController';
import { ProjectForm } from './../../forms';
import projectCmdHandler from './../../command-handlers/impl/ProjectCmdHandler';


class ProjectsController extends BaseController {

  createProject = this.command({
    form: ProjectForm, h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx);
        
        ctx.status = 200;
        ctx.body = { model: "ok" };

      } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });

}


const projectsCtrl = new ProjectsController();


module.exports = projectsCtrl;