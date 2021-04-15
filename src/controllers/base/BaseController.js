import ApplicationCommandExtractor from './../../middlewares/ApplicationCommandExtractor';


class BaseController {

  action(actionHandler) {
    return new ApplicationCommandExtractor(actionHandler, false);
  }

  actionForm(FormHandler, actionHandler) {
    return new FormHandler(new ApplicationCommandExtractor(actionHandler, true));
  }

}


module.exports = BaseController;