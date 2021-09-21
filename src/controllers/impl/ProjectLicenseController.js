import BaseController from '../base/BaseController';
import { NotFoundError } from '../../errors';
import { ProjectLicensingDtoService } from '../../services';

const projectLicensingDtoService = new ProjectLicensingDtoService();

class ProjectLicenseController extends BaseController {

  getProjectLicense = this.query({
    h: async (ctx) => {
      try {
        const licenseId = ctx.params.licenseId;
        const license = await projectLicensingDtoService.getProjectLicense(licenseId);
        if (!license) {
          throw new NotFoundError(`License "${licenseId}" id is not found`);
        }
        ctx.body = license;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectLicensesByLicensee = this.query({
    h: async (ctx) => {
      try {
        const licensee = ctx.params.licensee;
        const expertise = await projectLicensingDtoService.getProjectLicensesByLicensee(licensee);

        ctx.body = expertise;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectLicensesByLicenser = this.query({
    h: async (ctx) => {
      try {
        const licenser = ctx.params.licenser;
        const expertise = await projectLicensingDtoService.getProjectLicensesByLicenser(licenser);

        ctx.body = expertise;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectLicensesByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const expertise = await projectLicensingDtoService.getProjectLicensesByProject(projectId);

        ctx.body = expertise;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectLicensesByLicenseeAndProject = this.query({
    h: async (ctx) => {
      try {
        const { licensee, projectId } = ctx.params;
        const expertise = await projectLicensingDtoService.getProjectLicensesByLicenseeAndProject(licensee, projectId);

        ctx.body = expertise;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectLicensesByLicenseeAndLicenser = this.query({
    h: async (ctx) => {
      try {
        const { licensee, licenser } = ctx.params;
        const expertise = await projectLicensingDtoService.getProjectLicensesByLicenseeAndLicenser(licensee, licenser);

        ctx.body = expertise;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
}

const projectLicenseCtrl = new ProjectLicenseController();

module.exports = projectLicenseCtrl;