import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, PROPOSAL_STATUS, ATTRIBUTE_TYPE, RESEARCH_STATUS, USER_INVITE_STATUS, RESEARCH_ATTRIBUTE, TOKEN_SALE_STATUS, ATTR_SCOPES } from './../../constants';
import { handle, fire, wait } from './utils';
import ProjectDtoService from './../../services/impl/read/ProjectDtoService';
import ProjectService from './../../services/impl/write/ProjectService';
import ProposalService from './../../services/impl/read/ProposalDtoService';
import { AttributeDtoService } from './../../services';


class ResearchHandler extends EventEmitter { }

const researchHandler = new ResearchHandler();

const projectService = new ProjectService();


researchHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: userResignationProposalSignedEvent, tenant } = event;

  const projectDtoService = new ProjectDtoService();
  const proposalsService = new ProposalService();
  const attributeDtoService = new AttributeDtoService();

  const proposalId = userResignationProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);
  const { member, researchGroupExternalId } = proposal.details;

  const researchAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.PROJECT);

  const researches = await projectDtoService.getProjectsByTeam(researchGroupExternalId);

  const promises = [];
  for (let i = 0; i < researches.length; i++) {
    const research = researches[i];

    let hasUpdate = false;

    const membersAttributes = researchAttributes.filter(attr => attr.type == ATTRIBUTE_TYPE.USER);
    for (let j = 0; j < membersAttributes.length; j++) {
      const membersAttribute = membersAttributes[j];
      const rAttr = research.researchRef.attributes.find(rAttr => rAttr.attributeId.toString() == membersAttribute._id.toString());

      if (rAttr.value.some(m => m == member)) {
        rAttr.value = rAttr.value.filter(m => m != member);
        hasUpdate = true;
      }
    }

    if (hasUpdate) {
      promises.push(projectService.updateProject(research.external_id, { attributes: research.researchRef.attributes }));
    }
  }

  await Promise.all(promises);

}));

export default researchHandler;