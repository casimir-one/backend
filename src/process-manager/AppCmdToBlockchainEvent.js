import { APP_CMD, DOMAIN_EVENT } from "@deip/constants";
import config from "../config";


const APP_CMD_TO_BC_EVENT_PROCESSOR = {
  [APP_CMD.CREATE_DAO]: [{
    eventNum: DOMAIN_EVENT.DAO_CREATE,
    matchF: (txInfo, cmd, event) => {
      const cmdDaoId = cmd.getCmdPayload().entityId;
      const eventDaoId = Buffer.from(event.getEventPayload().dao.id).toString('hex');
      return cmdDaoId === eventDaoId;
    }
  }],
  [APP_CMD.TRANSFER_FT]: [
    {
      eventNum: DOMAIN_EVENT.NATIVE_FT_TRANSFER,
      matchF: (txInfo, cmd, event) => {
        const { from: cmdFromDaoId, to: cmdToDaoId, amount: cmdAmount, tokenId } = cmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();
        //TODO: find a way to match daoId with address
        const result = +cmdAmount === +eventAmount && tokenId === config.CORE_ASSET.id
        return result;
      }
    },
    {
      eventNum: DOMAIN_EVENT.FT_TRANSFERRED,
      matchF: (txInfo, cmd, event) => {
        const { from: cmdFromDaoId, to: cmdToDaoId, amount: cmdAmount, tokenId } = cmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();
        //TODO: find a way to match daoId with address
        //TODO: add tokenId match
        const result = +cmdAmount === +eventAmount;
        return result;
      }
    },
  ],
  [APP_CMD.TRANSFER_NFT]: [{
    eventNum: DOMAIN_EVENT.NFT_TRANSFERRED,
    matchF: (txInfo, cmd, event) => {
      //TODO: add match f
      return true;
    }
  }],
  [APP_CMD.CREATE_FT]: [{
    eventNum: DOMAIN_EVENT.FT_CLASS_CREATED,
    matchF: (txInfo, cmd, event) => {
      const { entityId: cmdFtId } = cmd.getCmdPayload();
      const { asset_id: eventFtId } = event.getEventPayload();
      return cmdFtId === eventFtId;
    }
  }],
  [APP_CMD.ISSUE_FT]: [{
    eventNum: DOMAIN_EVENT.FT_ISSUED,
    matchF: (txInfo, cmd, event) => {
      const { tokenId: cmdFtId, amount: cmdAmount } = cmd.getCmdPayload();
      const { asset_id: eventFtId, total_supply: eventAmount } = event.getEventPayload();
      const result = cmdFtId === eventFtId && cmdAmount === eventAmount;
      return result;
    }
  }]
}

module.exports = APP_CMD_TO_BC_EVENT_PROCESSOR;
