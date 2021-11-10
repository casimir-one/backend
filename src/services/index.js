import TeamService from './impl/write/TeamService';
import TeamDtoService from './impl/read/TeamDtoService';
import ProjectService from './impl/write/ProjectService';
import ProjectDtoService from './impl/read/ProjectDtoService';
import ProposalService from './impl/write/ProposalService';
import ProposalDtoService from './impl/read/ProposalDtoService';
import AttributeService from './impl/write/AttributeService';
import AttributeDtoService from './impl/read/AttributeDtoService';
import AssetDtoService from './impl/read/AssetDtoService';
import AssetService from './impl/write/AssetService';
import DomainDtoService from './impl/read/DomainDtoService';
import UserDtoService from './impl/read/UserDtoService';
import UserService from './impl/write/UserService';
import InvestmentOpportunityDtoService from './impl/read/InvestmentOpportunityDtoService';
import InvestmentOpportunityService from './impl/write/InvestmentOpportunityService';
import InvestmentOpportunityParticipationDtoService from './impl/read/InvestmentOpportunityParticipationDtoService';
import InvestmentOpportunityParticipationService from './impl/write/InvestmentOpportunityParticipationService';
import DocumentTemplateDtoService from './impl/read/DocumentTemplateDtoService';
import DocumentTemplateService from './impl/write/DocumentTemplateService';
import ProjectContentDtoService from './impl/read/ProjectContentDtoService';
import ProjectContentService from './impl/write/ProjectContentService';
import DraftService from './impl/write/DraftService';
import ReviewRequestDtoService from './impl/read/ReviewRequestDtoService';
import ReviewRequestService from './impl/write/ReviewRequestService';
import ReviewDtoService from './impl/read/ReviewDtoService';
import ReviewService from './impl/write/ReviewService';
import ProjectNdaDtoService from './impl/read/ProjectNdaDtoService';
import ContractAgreementDtoService from './impl/read/ContractAgreementDtoService';
import ContractAgreementService from './impl/write/ContractAgreementService';
import RevenueDtoService from './impl/read/RevenueDtoService';

module.exports = {
  TeamService,
  TeamDtoService,

  ProjectService,
  ProjectDtoService,

  ProposalService,
  ProposalDtoService,

  AssetDtoService,
  AssetService,

  AttributeService,
  AttributeDtoService,

  DomainDtoService,

  UserService,
  UserDtoService,

  InvestmentOpportunityService,
  InvestmentOpportunityDtoService,
  InvestmentOpportunityParticipationDtoService,
  InvestmentOpportunityParticipationService,

  DocumentTemplateDtoService,
  DocumentTemplateService,

  ProjectContentDtoService,
  ProjectContentService,
  DraftService,

  ReviewRequestDtoService,
  ReviewRequestService,
  ReviewDtoService,
  ReviewService,

  ProjectNdaDtoService,

  ContractAgreementDtoService,
  ContractAgreementService,

  RevenueDtoService
}