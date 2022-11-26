import { SubstrateChainUtils } from '@casimir.one/chain-service';
import { APP_CMD, DOMAIN_EVENT } from "@casimir.one/platform-core";
import config from "../config";

const { toAddress, toHexFormat } = SubstrateChainUtils;

const checkMatch = (obj) => !Object.values(obj).includes(false);

const APP_CMD_TO_BC_EVENT_PROCESSOR = {

  [APP_CMD.CREATE_DAO]: [{
    eventNum: DOMAIN_EVENT.DAO_CREATE,
    matchF: ({ txInfo, appCmd, event }) => {
      const { entityId: cmdDaoId } = appCmd.getCmdPayload();
      const { dao: { id: eventDaoIdBuffer } } = event.getEventPayload();
      return checkMatch({
        daoId: cmdDaoId === Buffer.from(eventDaoIdBuffer).toString('hex')
      })
    }
  }],

  [APP_CMD.TRANSFER_FT]: [
    {
      eventNum: DOMAIN_EVENT.NATIVE_FT_TRANSFER,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { from: cmdFrom, to: cmdTo, amount: cmdAmount, tokenId: cmdTokenId } = appCmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();

        const { registry } = chainService.getChainNodeClient();

        return checkMatch({
          from: toAddress(cmdFrom, registry) === eventFromAddress,
          to: toAddress(cmdTo, registry) === eventToAddress,
          amount: cmdAmount == eventAmount,
          tokenId: cmdTokenId == config.CORE_ASSET.id
        });
      }
    },
    {
      eventNum: DOMAIN_EVENT.FT_TRANSFERRED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { from: cmdFromDaoId, to: cmdToDaoId, amount: cmdAmount, tokenId } = appCmd.getCmdPayload();
        const { from: eventFromAddress, to: eventToAddress, amount: eventAmount } = event.getEventPayload();

        const { registry } = chainService.getChainNodeClient();

        return checkMatch({
          from: toAddress(cmdFromDaoId, registry) === eventFromAddress,
          to: toAddress(cmdToDaoId, registry) === eventToAddress,
          amount: cmdAmount == eventAmount,
          // tokenId: tokenId == eventTokenId
        })
      }
    },
  ],

  [APP_CMD.TRANSFER_NFT]: [{
    eventNum: DOMAIN_EVENT.NFT_TRANSFERRED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      //TODO: add match f
      return true;
    }
  }],

  [APP_CMD.CREATE_FT]: [{
    eventNum: DOMAIN_EVENT.FT_CLASS_CREATED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { entityId: cmdFtId } = appCmd.getCmdPayload();
      const { asset_id: eventFtId } = event.getEventPayload();

      return checkMatch({
        ftId: cmdFtId == eventFtId
      })
    }
  }],

  [APP_CMD.CREATE_NFT_ITEM]: [{
    eventNum: DOMAIN_EVENT.FT_ISSUED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { tokenId: cmdFtId, amount: cmdAmount } = appCmd.getCmdPayload();
      const { asset_id: eventFtId, total_supply: eventAmount } = event.getEventPayload();

      return checkMatch({
        ftId: cmdFtId == eventFtId,
        amount: cmdAmount == eventAmount
      })
    }
  }],

  [APP_CMD.CREATE_NFT_COLLECTION]: [{
    eventNum: DOMAIN_EVENT.NFT_COLLECTION_CREATED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { entityId: cmdClassId, ownerId: cmdIssuer } = appCmd.getCmdPayload();
      const { class: eventClassId, creator: eventIssuerAddress, owner: eventOwnerAddress } = event.getEventPayload();

      const { registry } = chainService.getChainNodeClient();


      return checkMatch({
        classId: cmdClassId == eventClassId,
        ownerId: toAddress(cmdIssuer, registry) == eventIssuerAddress,
      })
    }
  }],

  [APP_CMD.CREATE_PROPOSAL]: [{
    eventNum: DOMAIN_EVENT.PROPOSAL_CREATED,
    matchF: ({ txInfo, appCmd, event, chainService }) => {
      const { creator: cmdIssuerDaoId, entityId: cmdProposalId } = appCmd.getCmdPayload();
      const { author: eventIssuerAddress, proposal_id: eventProposalId } = event.getEventPayload();

      const { registry } = chainService.getChainNodeClient();

      return checkMatch({
        issuer: toAddress(cmdIssuerDaoId, registry) === eventIssuerAddress,
        proposalId: toHexFormat(cmdProposalId) === eventProposalId
      })
    }
  }],

  [APP_CMD.ACCEPT_PROPOSAL]: [
    {
      eventNum: DOMAIN_EVENT.PROPOSAL_APPROVED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { entityId: cmdProposalId, account: cmdIssuerDaoId } = appCmd.getCmdPayload();
        const { proposal_id: eventProposalIdBuffer, member: eventIssuerAddress } = event.getEventPayload();

        const { registry } = chainService.getChainNodeClient();

        return checkMatch({
          proposalId: cmdProposalId === Buffer.from(eventProposalIdBuffer).toString('hex'),
          issuer: toAddress(cmdIssuerDaoId, registry) === eventIssuerAddress
        })
      }
    },
    {
      eventNum: DOMAIN_EVENT.PROPOSAL_RESOLVED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { entityId: cmdProposalId, account: cmdIssuerDaoId } = appCmd.getCmdPayload();
        const { proposal_id: eventProposalIdBuffer, member: eventIssuerAddress, state } = event.getEventPayload();

        const { registry } = chainService.getChainNodeClient();

        return checkMatch({
          issuer: toAddress(cmdIssuerDaoId, registry) === eventIssuerAddress,
          proposalId: cmdProposalId === Buffer.from(eventProposalIdBuffer).toString('hex'),
          state: state === 'Done'
        })
      }
    }
  ],

  [APP_CMD.DECLINE_PROPOSAL]: [
    //TODO: add proposal_declined event when it will be implemented on blockchain
    {
      eventNum: DOMAIN_EVENT.PROPOSAL_RESOLVED,
      matchF: ({ txInfo, appCmd, event, chainService }) => {
        const { entityId: cmdProposalId, account: cmdIssuerDaoId } = appCmd.getCmdPayload();
        const { proposal_id: eventProposalIdBuffer, member: eventIssuerAddress, state } = event.getEventPayload();

        const { registry } = chainService.getChainNodeClient();

        return checkMatch({
          issuer: toAddress(cmdIssuerDaoId, registry) === eventIssuerAddress,
          proposalId: cmdProposalId === Buffer.from(eventProposalIdBuffer).toString('hex'),
          state: state === "Rejected",
        });
      }
    }
  ]
}

module.exports = APP_CMD_TO_BC_EVENT_PROCESSOR;
