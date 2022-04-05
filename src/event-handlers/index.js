import projectEventHandler from './impl/ProjectEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import teamEventHandler from './impl/TeamEventHandler';
import userNotificationEventHandler from './impl/UserNotificationEventHandler';
import userInviteEventHandler from './impl/UserInviteEventHandler';
import attributeEventHandler from './impl/AttributeEventHandler';
import userEventHandler from './impl/UserEventHandler';
import documentTemplateEventHandler from './impl/DocumentTemplateEventHandler';
import investmentOpportunityEventHandler from './impl/InvestmentOpportunityEventHandler';
import assetEventHandler from './impl/AssetEventHandler';
import projectContentEventHandler from './impl/ProjectContentEventHandler';
import reviewEventHandler from './impl/ReviewEventHandler';
import contractAgreementEventHandler from './impl/ContractAgreementEventHandler';
import fileUploadEventHandler from './impl/FileUploadEventHandler';
import portalEventHandler from './impl/PortalEventHandler';
import userSettingsEventHandler from './impl/UserSettingsEventHandler';
import layoutEventHandler from './impl/LayoutEventHandler';
import onChainBlockEventHandler from './impl/OnChainBlockEventHandler';
import onChainProposalEventHandler from './impl/OnChainProposalEventHandler';
import onChainProjectEventHandler from './impl/OnChainProjectEventHandler';
import onChainContractAgreementEventHandler from './impl/OnChainContractAgreementEventHandler';
import onChainDaoEventHandler from './impl/OnChainDaoEventHandler';
import onChainAssetEventHandler from './impl/OnChainAssetEventHandler';


module.exports = {
  projectEventHandler,
  proposalEventHandler,
  teamEventHandler,
  userNotificationEventHandler,
  userInviteEventHandler,
  attributeEventHandler,
  userEventHandler,
  documentTemplateEventHandler,
  investmentOpportunityEventHandler,
  assetEventHandler,
  projectContentEventHandler,
  reviewEventHandler,
  contractAgreementEventHandler,
  fileUploadEventHandler,
  portalEventHandler,
  userSettingsEventHandler,
  layoutEventHandler,
  //CHAIN PROPOSAL PROJECT CONTRACT_AGREEMENT DAO ASSET
  onChainBlockEventHandler,
  onChainProposalEventHandler,
  onChainProjectEventHandler,
  onChainContractAgreementEventHandler,
  onChainDaoEventHandler,
  onChainAssetEventHandler
};
