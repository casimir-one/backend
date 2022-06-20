import { APP_CMD, DOMAIN_EVENT } from "@deip/constants";
import config from "../config";
import { SubstrateChainUtils } from '@deip/chain-service';



const checkMatch = (obj) => !Object.values(obj).includes(false);

const APP_CMD_TO_BC_EVENT_PROCESSOR = {

  [APP_CMD.CREATE_DAO]: [{
    eventNum: DOMAIN_EVENT.DAO_CREATE,
    matchF: ({ txInfo, appCmd, event }) => {
      const { entityId: cmdDaoId } = appCmd.getCmdPayload();
      const { dao: { id: eventDaoIdBuffer } } = event.getEventPayload();

      return cmdDaoId === Buffer.from(eventDaoIdBuffer).toString('hex');
    }
  }],

  [APP_CMD.TRANSFER_FT]: [
    {
      eventNum: DOMAIN_EVENT.NATIVE_FT_TRANSFER,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { from: cmdFromDaoId, to: cmdToDaoId, amount: cmdAmount, tokenId } = appCmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();
        // const chainNodeClient = chainService.getChainNodeClient();
        // const registry = chainNodeClient.registry;

        return checkMatch({
          // from: SubstrateChainUtils.daoIdToAddress(cmdFromDaoId, registry) === eventFromAddress,
          // to: SubstrateChainUtils.daoIdToAddress(cmdToDaoId, registry) === eventToAddress,
          amount: cmdAmount == eventAmount,
          tokenId: tokenId == config.CORE_ASSET.id
        });
      }
    },
    {
      eventNum: DOMAIN_EVENT.FT_TRANSFERRED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { from: cmdFromDaoId, to: cmdToDaoId, amount: cmdAmount, tokenId } = appCmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();
        //TODO: find a way to match daoId with address
        //TODO: add tokenId match
        return +cmdAmount === +eventAmount;
      }
    },
  ],

  // [APP_CMD.TRANSFER_NFT]: [{
  //   eventNum: DOMAIN_EVENT.NFT_TRANSFERRED,
  //    matchF: ({txInfo, appCmd, event, chainService}) => {
  //     //TODO: add match f
  //     return true;
  //   }
  // }],

  [APP_CMD.CREATE_FT]: [{
    eventNum: DOMAIN_EVENT.FT_CLASS_CREATED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { entityId: cmdFtId } = appCmd.getCmdPayload();
      const { asset_id: eventFtId } = event.getEventPayload();

      return cmdFtId === eventFtId;
    }
  }],

  [APP_CMD.CREATE_NFT_ITEM]: [{
    eventNum: DOMAIN_EVENT.FT_ISSUED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { tokenId: cmdFtId, amount: cmdAmount } = appCmd.getCmdPayload();
      const { asset_id: eventFtId, total_supply: eventAmount } = event.getEventPayload();

      return cmdFtId === eventFtId && cmdAmount === eventAmount;
    }
  }],

  [APP_CMD.CREATE_PROPOSAL]: [{
    eventNum: DOMAIN_EVENT.PROPOSAL_CREATED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { creator: cmdIssuerDaoId, entityId: cmdProposalId } = appCmd.getCmdPayload();
      const { author: eventIssuerAddress, proposal_id: eventProposalId } = event.getEventPayload();
      //TODO: cmdIssuerDaoId.toAddress === eventIssuerAddress
      return eventProposalId === `0x${cmdProposalId}`;
    }
  }],

  [APP_CMD.ACCEPT_PROPOSAL]: [
    {
      eventNum: DOMAIN_EVENT.PROPOSAL_APPROVED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { entityId: cmdProposalId, account: cmdIssuerDaoId } = appCmd.getCmdPayload();
        const { proposal_id: eventProposalIdBuffer, member: eventIssuerAddress } = event.getEventPayload();
        //TODO: cmdIssuerDaoId.toAddress === eventIssuerAddress
        return cmdProposalId === Buffer.from(eventProposalIdBuffer).toString('hex');
      }
    },
    {
      eventNum: DOMAIN_EVENT.PROPOSAL_RESOLVED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { entityId: cmdProposalId, account: cmdIssuerDaoId } = appCmd.getCmdPayload();
        const { proposal_id: eventProposalIdBuffer, member: eventIssuerAddress } = event.getEventPayload();
        //TODO: cmdIssuerDaoId.toAddress === eventIssuerAddress
        return cmdProposalId === Buffer.from(eventProposalIdBuffer).toString('hex');
      }
    }
  ]
}

module.exports = APP_CMD_TO_BC_EVENT_PROCESSOR;
