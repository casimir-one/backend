import { APP_CMD, CONTRACT_AGREEMENT_TYPE } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError, NotFoundError } from '../../errors';
import { contractAgreementCmdHandler } from '../../command-handlers';
import { ContractAgreementDtoService } from '../../services';
import { ContractAgreementForm } from './../../forms';
import FileStorage from './../../storage';
import slug from 'limax';
import qs from 'qs';

const contractAgreementDtoService = new ContractAgreementDtoService();

class ContractAgreementController extends BaseController {

  getContractAgreement = this.query({
    h: async (ctx) => {
      try {
        const contractAgreementId = ctx.params.contractAgreementId;
        const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);

        if (!contractAgreement) {
          throw new NotFoundError(`ContractAgreement "${contractAgreementId}" contractAgreementId is not found`);
        }

        ctx.successRes(contractAgreement);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getContractAgreements = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const contractAgreements = await contractAgreementDtoService.getContractAgreements(query);

        ctx.successRes(contractAgreements);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getContractAgreementFile = this.query({
    h: async (ctx) => {
      try {
        const filename = ctx.params.filename;
        const isDownload = ctx.query.download === 'true';

        const filepath = FileStorage.getContractAgreementFilePath(filename);
        const exists = await FileStorage.exists(filepath);
        if (!exists) {
          throw new NotFoundError(`Contract file with "${filepath}" filepath is not found`);
        }
        const buff = await FileStorage.get(filepath);

        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));

        if (isDownload) {
          ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        } else { 
          ctx.response.set('Content-Type', `application/${ext}`);
          ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
        }
        ctx.successRes(buff, { withoutWrap: true });
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  proposeContractAgreement = this.command({
    form: ContractAgreementForm,
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

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  rejectContractAgreement = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.REJECT_CONTRACT_AGREEMENT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };
        
        const msg = ctx.state.msg;
        await contractAgreementCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}

const contractAgreementCtrl = new ContractAgreementController();

module.exports = contractAgreementCtrl;