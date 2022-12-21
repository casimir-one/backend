import BaseController from '../base/BaseController';
import { UserDtoService } from '../../services';
import qs from 'qs';
import { accountCmdHandler } from './../../command-handlers';
import { APP_CMD } from '@casimir.one/platform-core';
import { UserForm } from './../../forms';
import { BadRequestError, NotFoundError } from './../../errors';


const userDtoService = new UserDtoService();
const validateEmail = (email) => {
  const patternStr = ['^(([^<>()[\\]\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)',
    '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
    '[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+',
    '[a-zA-Z]{2,}))$'].join('');
  const pattern = new RegExp(patternStr);

  return pattern.test(email) && email.split('@')[0].length <= 64;
}


class UsersController extends BaseController {


  getUsersPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const { 
          paginationMeta, 
          result 
        } = await userDtoService.getUsersPaginated(filter, sort, { page, pageSize });
        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  getUser = this.query({
    h: async (ctx) => {
      try {
        const usernameOrEmail = ctx.params.usernameOrEmail;
        let user;
        if (usernameOrEmail.includes('@')) {
          user = await userDtoService.getUserByEmail(usernameOrEmail);
        } else {
          user = await userDtoService.getUser(usernameOrEmail);
        }
        ctx.successRes(user || null);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createUser = this.command({
    form: UserForm,
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.CREATE_USER,
            validate: async (cmd) => {
              const { _id, email } = cmd.getCmdPayload();
              if (!_id) {
                throw new BadRequestError(`'_id' fields is required`);
              }
              if (!validateEmail(email)) {
                throw new BadRequestError(`'email' field is required and should be in correct format`);
              }
            }
          };
          const validCmdsOrder = [cmd1];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);
        
        const _id = this.extractEntityId(msg, APP_CMD.CREATE_USER);
        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  updateUser = this.command({
    form: UserForm,
    h: async (ctx) => {

      try {
        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.UPDATE_USER,
            validate: async (cmd) => {}
          };
          const validCmdsOrder = [cmd1];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const _id = this.extractEntityId(msg, APP_CMD.UPDATE_USER);
        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

}

const usersCtrl = new UsersController();

module.exports = usersCtrl;