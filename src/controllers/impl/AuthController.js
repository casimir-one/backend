import { APP_CMD } from '@deip/constants';
import BaseController from './../base/BaseController';
import { BadRequestError, ConflictError } from './../../errors';
import { accountCmdHandler } from './../../command-handlers';
import { UserService } from './../../services';
import config from './../../config';
import { USER_ROLES } from './../../constants';
import deipRpc from '@deip/rpc-client';

const userService = new UserService();

class AuthController extends BaseController {
  signUp = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { entityId, email, memoKey, roles } = appCmd.getCmdPayload();
          if (Array.isArray(roles) && roles.find(({ role }) => role === USER_ROLES.ADMIN)) {
            throw new BadRequestError(`Can't create admin account`);
          }
          if (!entityId || !memoKey || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(entityId)) {
            throw new BadRequestError(`'username', 'pubKey', fields are required. Username allowable symbols are: [a-z0-9] `);
          }
          
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (!pattern.test(email)) {
            throw new BadRequestError(`'email' field are required. Email should be correct and contains @`);
          }

          const existingProfile = await userService.getUser(entityId);
          if (existingProfile) {
            throw new ConflictError(`Profile for '${entityId}' is under consideration or has been approved already`);
          }
        };

        const registrar = config.FAUCET_ACCOUNT;
        const { wif: regaccPrivKey } = registrar;

        const msg = ctx.state.msg;
        await msg.tx.signAsync(regaccPrivKey, deipRpc);

        await accountCmdHandler.process(msg, ctx, validate);
        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
        const { entityId } = appCmd.getCmdPayload();

        ctx.status = 200;
        ctx.body = {
          entityId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const authCtrl = new AuthController();

module.exports = authCtrl;