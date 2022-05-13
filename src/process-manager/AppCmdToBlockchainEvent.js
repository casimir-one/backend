import { APP_CMD, DOMAIN_EVENT } from "@deip/constants";


const APP_CMD_TO_BC_EVENT_PROCESSOR = {
  [APP_CMD.CREATE_DAO]: {
    eventNum: DOMAIN_EVENT.DAO_CREATE,
    matchF: (txInfo, cmd, event) => {
      const cmdDaoId = cmd.getCmdPayload().entityId;
      const eventDaoId = Buffer.from(event.getEventPayload().dao.id).toString('hex');
      return cmdDaoId === eventDaoId;
    }
  },
  [APP_CMD.TRANSFER_FT]: {
    eventNum: DOMAIN_EVENT.BLOCK_CREATED,
    matchF: (txInfo, cmd, event) => {
      console.log("MATCH TRANSFER_FT", { txInfo, cmd: cmd.getCmdPayload(), event: event.getEventPayload() });
      //TODO add match f
      return true;
    }
  },
  [APP_CMD.TRANSFER_NFT]: {
    eventNum: DOMAIN_EVENT.BLOCK_CREATED,
    matchF: (txInfo, cmd, event) => {
      console.log("MATCH TRANSFER_NFT", { txInfo, cmd: cmd.getCmdPayload(), event: event.getEventPayload() });
      //TODO add match f
      return true;
    }
  }
}

module.exports = APP_CMD_TO_BC_EVENT_PROCESSOR;
