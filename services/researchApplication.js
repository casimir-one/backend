import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import ResearchApplication from './../schemas/researchApplication';


class ResearchApplicationService extends BaseReadModelService {

  constructor() { super(ResearchApplication); }


  async getResearchApplication(applicationId) {
    const result = await this.findOne({ _id: applicationId });
    return result;
  }


  async getResearchApplications({ status, researcher }) {
    const query = {};
    if (status) {
      query.status = status;
    }
    if (researcher) {
      query.researcher = researcher;
    }
    const result = await this.findMany(query);
    return result;
  }


  async createResearchApplication({
    proposalId,
    researchExternalId,
    researcher,
    status,
    title,
    description,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    attributes,
    budgetAttachment,
    businessPlanAttachment,
    cvAttachment,
    marketResearchAttachment,
    tx
  }) {

    const result = await this.createOne({
      _id: proposalId,
      researchExternalId,
      researcher,
      status,
      title,
      description,
      disciplines,
      problem,
      solution,
      funding,
      eta,
      location,
      attributes,
      budgetAttachment,
      businessPlanAttachment,
      cvAttachment,
      marketResearchAttachment,
      tx
    });

    return result;
  }


  async updateResearchApplication(applicationId, {
    status,
    description,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    attributes,
    budgetAttachment,
    businessPlanAttachment,
    cvAttachment,
    marketResearchAttachment
  }) {

    const result = await this.updateOne({ _id: applicationId }, {
      status: status ? status : undefined,
      description: description ? description : undefined,
      disciplines: disciplines ? disciplines : undefined,
      problem: problem ? problem : undefined,
      solution: solution ? solution : undefined,
      funding: funding ? funding : undefined,
      eta: eta ? eta : undefined,
      location: location ? location : undefined,
      attributes: attributes ? attributes : undefined,
      budgetAttachment: budgetAttachment ? budgetAttachment : undefined,
      businessPlanAttachment: businessPlanAttachment ? businessPlanAttachment : undefined,
      cvAttachment: cvAttachment ? cvAttachment : undefined,
      marketResearchAttachment: marketResearchAttachment ? marketResearchAttachment : undefined
    });

    return result;
  }

}


export default ResearchApplicationService;