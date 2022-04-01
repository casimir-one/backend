import { APP_CMD } from "@deip/constants";
import APP_EVENT from "../events/base/AppEvent";


const APP_CMD_TO_BC_EVENT_PROCESSOR = {
  [APP_CMD.CREATE_DAO]: {
    eventNum: APP_EVENT.CHAIN_DAO_CREATE, matchF: (txInfo, cmd, event) => {
      const cmdDaoId = cmd.getCmdPayload().entityId;
      const eventDaoId = Buffer.from(event.getEventPayload().dao.id).toString('hex');
      return cmdDaoId === eventDaoId;
    }
  },
  // [APP_CMD.UPDATE_DAO]: { class: UpdateDaoCmd },
  // [APP_CMD.ALTER_DAO_AUTHORITY]: { class: AlterDaoAuthorityCmd },
  // [APP_CMD.CREATE_PROJECT]: { class: CreateProjectCmd },
  // [APP_CMD.UPDATE_PROJECT]: { class: UpdateProjectCmd },
  // [APP_CMD.DELETE_PROJECT]: { class: DeleteProjectCmd },
  // [APP_CMD.ADD_DAO_MEMBER]: { class: AddDaoMemberCmd },
  // [APP_CMD.CREATE_PROPOSAL]: { class: CreateProposalCmd },
  // [APP_CMD.ACCEPT_PROPOSAL]: { class: AcceptProposalCmd },
  // [APP_CMD.DECLINE_PROPOSAL]: { class: DeclineProposalCmd },
  // [APP_CMD.CREATE_ATTRIBUTE]: { class: CreateAttributeCmd },
  // [APP_CMD.UPDATE_ATTRIBUTE]: { class: UpdateAttributeCmd },
  // [APP_CMD.DELETE_ATTRIBUTE]: { class: DeleteAttributeCmd },
  // [APP_CMD.REMOVE_DAO_MEMBER]: { class: RemoveDaoMemberCmd },
  // [APP_CMD.CREATE_INVESTMENT_OPPORTUNITY]: { class: CreateInvestmentOpportunityCmd },
  // [APP_CMD.INVEST]: { class: InvestCmd },
  [APP_CMD.TRANSFER_FT]: { eventNum: APP_EVENT.CHAIN_BLOCK_CREATED, matchF: (txInfo, cmd, event) => {
    console.log("MATCH TRANSFER_FT", {txInfo, cmd: cmd.getCmdPayload(), event: event.getEventPayload()});
    //TODO add match f
    return true;
  } },
  [APP_CMD.TRANSFER_NFT]: { eventNum: APP_EVENT.CHAIN_BLOCK_CREATED, matchF: (txInfo, cmd, event) => {
      console.log("MATCH TRANSFER_NFT", {txInfo, cmd: cmd.getCmdPayload(), event: event.getEventPayload()});
    //TODO add match f
    return true;
  } }
  // [APP_CMD.CREATE_DOCUMENT_TEMPLATE]: { class: CreateDocumentTemplateCmd },
  // [APP_CMD.UPDATE_DOCUMENT_TEMPLATE]: { class: UpdateDocumentTemplateCmd },
  // [APP_CMD.DELETE_DOCUMENT_TEMPLATE]: { class: DeleteDocumentTemplateCmd },
  // [APP_CMD.CREATE_FT]: { class: CreateFungibleTokenCmd },
  // [APP_CMD.CREATE_NFT]: { class: CreateNonFungibleTokenCmd },
  // [APP_CMD.ISSUE_FT]: { class: IssueFungibleTokenCmd },
  // [APP_CMD.ISSUE_NFT]: { class: IssueNonFungibleTokenCmd },
  // [APP_CMD.CREATE_DRAFT]: { class: CreateDraftCmd },
  // [APP_CMD.DELETE_DRAFT]: { class: DeleteDraftCmd },
  // [APP_CMD.UPDATE_DRAFT]: { class: UpdateDraftCmd },
  // [APP_CMD.CREATE_PROJECT_CONTENT]: { class: CreateProjectContentCmd },
  // [APP_CMD.CREATE_REVIEW_REQUEST]: { class: CreateReviewRequestCmd },
  // [APP_CMD.DECLINE_REVIEW_REQUEST]: { class: DeclineReviewRequestCmd },
  // [APP_CMD.CREATE_REVIEW]: { class: CreateReviewCmd },
  // [APP_CMD.UPVOTE_REVIEW]: { class: UpvoteReviewCmd },
  // [APP_CMD.CREATE_PROJECT_NDA]: { class: CreateProjectNdaCmd },
  // [APP_CMD.CREATE_CONTRACT_AGREEMENT]: { class: CreateContractAgreementCmd },
  // [APP_CMD.ACCEPT_CONTRACT_AGREEMENT]: { class: AcceptContractAgreementCmd },
  // [APP_CMD.REJECT_CONTRACT_AGREEMENT]: { class: RejectContractAgreementCmd },
  // [APP_CMD.UPDATE_PORTAL_PROFILE]: { class: UpdatePortalProfileCmd },
  // [APP_CMD.UPDATE_PORTAL_SETTINGS]: { class: UpdatePortalSettingsCmd },
  // [APP_CMD.CREATE_LAYOUT]: { class: CreateLayoutCmd },
  // [APP_CMD.UPDATE_LAYOUT]: { class: UpdateLayoutCmd },
  // [APP_CMD.DELETE_LAYOUT]: { class: DeleteLayoutCmd },
  // [APP_CMD.UPDATE_LAYOUT_SETTINGS]: { class: UpdateLayoutSettingsCmd },
  // [APP_CMD.UPDATE_ATTRIBUTE_SETTINGS]: { class: UpdateAttributeSettingsCmd },
  // [APP_CMD.UPDATE_NETWORK_SETTINGS]: { class: UpdateNetworkSettingsCmd },
  // [APP_CMD.DELETE_USER_PROFILE]: { class: DeleteUserProfileCmd },
  // [APP_CMD.CREATE_BOOKMARK]: { class: CreateBookmarkCmd },
  // [APP_CMD.DELETE_BOOKMARK]: { class: DeleteBookmarkCmd },
  // [APP_CMD.MARK_NOTIFICATIONS_AS_READ]: { class: MarkNotificationsAsReadCmd }
}

module.exports = APP_CMD_TO_BC_EVENT_PROCESSOR;
