import BaseController from '../base/BaseController';
import swaggerJSON from './../../swagger/swagger.json'

class SwaggerController extends BaseController {
  getSwaggerJSON = this.query({
    h: async (ctx) => {
      try {
        ctx.successRes(swaggerJSON);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
}

const swaggerCtrl = new SwaggerController();

module.exports = swaggerCtrl;