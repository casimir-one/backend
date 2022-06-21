import { APP_EVENT, APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';


class NFTLazyBuyProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    assert(!!proposalCmd, `'proposalCmd' is required`);

    assert(APP_PROPOSAL.NFT_LAZY_BUY_PROPOSAL == proposalCmd.getProposalType(),
      `This event must be generated out of ${APP_PROPOSAL.NFT_LAZY_BUY_PROPOSAL} proposal`);

    const { entityId: proposalId, expirationTime, proposedCmds } = proposalCmd.getCmdPayload();

    const [transferFtCmd, acceptProposalCmd, transferNftCmd] = proposedCmds;

    const { entityId, account, batchWeight } = acceptProposalCmd.getCmdPayload();
    const {
      from: transferFTCmdFrom, //Buyer
      to: transferFTCmdTo, //HotWallet 
      amount, tokenId
    } = transferFtCmd.getCmdPayload();

    const {
      from: transferNFTFrom, //HotWallet
      to: transferNFTTo, //Buyer
      nftCollectionId, nftItemId
    } = transferNftCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `Proposal 'expirationTime' is required`);
    assert(!!entityId, `Proposal 'entityId' is required`);

    assert(!!transferFTCmdFrom, "'from' is required");
    assert(!!transferFTCmdTo, "'to' is required");

    assert(!!transferNFTFrom, "'from' is required");
    assert(!!transferNFTTo, "'to' is required");

    assert(!!amount, "'amount' is required");
    assert(!!tokenId, "'tokenId' is required");
    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!nftItemId, "'nftItemId' is required");
    assert(!!batchWeight, "'batchWeight' is required");


    // if (expirationTime) {
    //   assert(new Date(expirationTime) > new Date(), "'expirationTime' must be greater than current time");
    // }

    super(APP_EVENT.NFT_LAZY_BUY_PROPOSAL_CREATED, {
      proposalId,
      batchWeight,
      nftCollectionId,
      nftItemId,
      issuer: transferFTCmdFrom, //Buyer
      expirationTime,
      proposalCmd,
      proposalCtx,
    });

  }

}


module.exports = NFTLazyBuyProposalCreatedEvent;