import TeamService from './impl/write/TeamService';
import TeamDtoService from './impl/read/TeamDtoService';
import ProjectService from './impl/write/ProjectService';
import ProjectDtoService from './impl/read/ProjectDtoService';
import ProposalService from './impl/write/ProposalService';
import ProposalDtoService from './impl/read/ProposalDtoService';
import AttributeService from './impl/write/AttributeService';
import AttributeDtoService from './impl/read/AttributeDtoService';
import AssetDtoService from './impl/read/AssetDtoService';
import DomainDtoService from './impl/read/DomainDtoService';
import UserDtoService from './impl/read/UserDtoService';
import UserService from './impl/write/UserService';
import InvestmentOpportunityDtoService from './impl/read/InvestmentOpportunityDtoService';
import InvestmentOpportunityService from './impl/write/InvestmentOpportunityService';
import DocumentTemplateDtoService from './impl/read/DocumentTemplateDtoService';
import DocumentTemplateService from './impl/write/DocumentTemplateService';


module.exports = {
  TeamService,
  TeamDtoService,

  ProjectService,
  ProjectDtoService,

  ProposalService,
  ProposalDtoService,

  AssetDtoService,

  AttributeService,
  AttributeDtoService,

  DomainDtoService,

  UserService,
  UserDtoService,

  InvestmentOpportunityService,
  InvestmentOpportunityDtoService,

  DocumentTemplateDtoService,
  DocumentTemplateService
}