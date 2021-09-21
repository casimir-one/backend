import { APP_CMD, CONTRACT_AGREEMENT_TYPE } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError } from '../../errors';
import { contractAgreementCmdHandler } from '../../command-handlers';
import { ContractAgreementDtoService } from '../../services';

const contractAgreementDtoService = new ContractAgreementDtoService();

class ContractAgreementController extends BaseController {

  getContractAgreementsListByCreator = this.query({
    h: async (ctx) => {
      try {
        const creator = ctx.params.creator;
        const expertise = await contractAgreementDtoService.getContractAgreementsListByCreator(creator);

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

  proposeContractAgreement = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_CONTRACT_AGREEMENT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_CONTRACT_AGREEMENT) {
            const { type } = appCmd.getCmdPayload();
            if (!CONTRACT_AGREEMENT_TYPE[type]) {
              throw new BadRequestError(`Unknown type of Contract-agreement`);
            }
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();

            const contractAgreementCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_CONTRACT_AGREEMENT);
  
            if (!contractAgreementCmd) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_CONTRACT_AGREEMENT]} protocol cmd`);
            }
            const { type } = contractAgreementCmd.getCmdPayload();
            if (!CONTRACT_AGREEMENT_TYPE[type]) {
              throw new BadRequestError(`Unknown type of Contract-agreement`);
            }
          }
        };
        
        const msg = ctx.state.msg;
        await contractAgreementCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  acceptContractAgreement = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ACCEPT_CONTRACT_AGREEMENT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };
        
        const msg = ctx.state.msg;
        await contractAgreementCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const contractAgreementCtrl = new ContractAgreementController();

module.exports = contractAgreementCtrl;