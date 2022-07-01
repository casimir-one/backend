import { APP_EVENT, APP_PROPOSAL } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';


class NFTLazySellProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    assert(!!proposalCmd, `'proposalCmd' is required`);

    assert(APP_PROPOSAL.NFT_LAZY_SELL_PROPOSAL == proposalCmd.getProposalType(),
      `This event must be generated out of ${APP_PROPOSAL.NFT_LAZY_SELL_PROPOSAL} proposal`);

    const { entityId: proposalId, expirationTime, proposedCmds } = proposalCmd.getCmdPayload();

    const [transferFtCmd, createNFTItemCmd] = proposedCmds;

    const {
      from, //hotWallet
      to, //creator or TENANT in case of nowar
      amount,
      tokenId
    } = transferFtCmd.getCmdPayload();

    const {
      issuer, //creator
      recipient, //hotWallet
      nftCollectionId,
      nftItemId
    } = createNFTItemCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `Proposal 'expirationTime' is required`);
    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(!!amount, "'amount' is required");
    assert(!!tokenId, "'tokenId' is required");
    assert(!!issuer, "'issuer' is required");
    assert(!!recipient, "'recipient' is required");
    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!nftItemId, "'nftItemId' is required");


    // if (expirationTime) {
    //   assert(new Date(expirationTime) > new Date(), "'expirationTime' must be greater than current time");
    // }

    super(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_CREATED, {
      proposalId,
      nftCollectionId,
      nftItemId,
      issuer,
      expirationTime,
      proposalCmd,
      proposalCtx,
    });

  }

}


module.exports = NFTLazySellProposalCreatedEvent;