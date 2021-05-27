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

  DomainDtoService

}