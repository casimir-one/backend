import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';
import ResearchApplication from './../schemas/researchApplication';
import { RESEARCH_APPLICATION_STATUS } from './../constants';

async function findResearchById(externalId) {
  let research = await Research.findOne({ _id: externalId });
  return research;
}

async function createResearch({
  externalId,
  researchGroupExternalId,
  researchGroupInternalId,
  milestones,
  videoSrc,
  partners,
  tenantCriterias,
}) {

  const research = new Research({
    _id: externalId,
    researchGroupExternalId,
    milestones,
    videoSrc,
    partners,
    tenantCriterias,
    researchGroupId: researchGroupInternalId, // legacy internal id
  });

  return research.save();
}

async function updateResearch(externalId, {
  milestones,
  videoSrc,
  partners,
  tenantCriterias
}) {

  const research = await findResearchById(externalId);
  research.milestones = milestones;
  research.videoSrc = videoSrc;
  research.partners = partners;
  research.tenantCriterias = tenantCriterias;

  return research.save();
}

async function findResearchApplicationById(applicationId) {
  let researchApplication = await ResearchApplication.findOne({ _id: applicationId });
  return researchApplication;
}

async function createResearchApplication({
  proposalId,
  researchExternalId,
  researcher,
  title,
  abstract,
  disciplines,
  problem,
  solution,
  funding,
  eta,
  location,
  tenantCriterias,
  budgetAttachment,
  businessPlanAttachment,
  cvAttachment,
  marketResearchAttachment,
  tx
}) {

  const researchApplication = new ResearchApplication({
    _id: proposalId,
    researchExternalId,
    researcher,
    status: RESEARCH_APPLICATION_STATUS.PENDING,
    title,
    abstract,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    tenantCriterias,
    budgetAttachment,
    businessPlanAttachment,
    cvAttachment,
    marketResearchAttachment,
    tx
  });

  return researchApplication.save();
}


async function updateResearchApplication(applicationId, {
  status,
  disciplines,
  problem,
  solution,
  funding,
  eta,
  location,
  tenantCriterias,
  budgetAttachment,
  businessPlanAttachment,
  cvAttachment,
  marketResearchAttachment
}) {

  const researchApplication = await findResearchApplicationById(applicationId);
  researchApplication.status = status;
  researchApplication.disciplines = disciplines;
  researchApplication.problem = problem;
  researchApplication.solution = solution;
  researchApplication.funding = funding;
  researchApplication.eta = eta;
  researchApplication.location = location;
  researchApplication.tenantCriterias = tenantCriterias;
  researchApplication.budgetAttachment = budgetAttachment;
  researchApplication.businessPlanAttachment = businessPlanAttachment;
  researchApplication.cvAttachment = cvAttachment;
  researchApplication.marketResearchAttachment = marketResearchAttachment;

  return researchApplication.save();
}


async function getResearchApplications({ status, researcher }) {
  const query = {};
  if (status) {
    query.status = status;
  }
  if (researcher) {
    query.researcher = researcher;
  }
  const result = await ResearchApplication.find(query);
  return result;
}

async function processResearchCriterias(
  oldComponents,
  newComponents
) {

  const addedComponents = [];
  const removedComponents = [];

  for (let i = 0; i < newComponents.length; i++) {
    let newCom = newComponents[i];
    if (oldComponents.some(oldCom => oldCom._id.toString() == newCom._id.toString())) continue;
    addedComponents.push(newCom);
  }

  for (let i = 0; i < oldComponents.length; i++) {
    let oldCom = oldComponents[i];
    if (newComponents.some(newCom => newCom._id.toString() == oldCom._id.toString())) continue;
    removedComponents.push(oldCom);
  }

  let addedCriteriaPromises = [];
  for (let i = 0; i < addedComponents.length; i++) {
    let component = addedComponents[i];
    addedCriteriaPromises.push(addCriteriaToResearches({
      component: component._id.toString(),
      type: component.type
    }))
  }

  let removedCriteriaPromises = [];
  for (let i = 0; i < removedComponents.length; i++) {
    let component = removedComponents[i];
    removedCriteriaPromises.push(removeCriteriaToResearches({
      component: component._id.toString()
    }))
  }

  await Promise.all(addedCriteriaPromises);
  await Promise.all(removedCriteriaPromises);
}


async function addCriteriaToResearches({
  component,
  type
}) {
  const result = await Research.update({}, { $push: { tenantCriterias: { component: component, type: type } } }, { multi: true });
  return result;
}

async function removeCriteriaToResearches({
  component
}) {
  const result = await Research.update({}, { $pull: { 'tenantCriterias': { 'component': component } } }, { multi: true });
  return result;
}


export default {
  findResearchById,
  createResearch,
  updateResearch,
  processResearchCriterias,
  addCriteriaToResearches,
  removeCriteriaToResearches,
  createResearchApplication,
  updateResearchApplication,
  findResearchApplicationById,
  getResearchApplications
}