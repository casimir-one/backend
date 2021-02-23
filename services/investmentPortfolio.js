import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import InvestmentPortfolio from './../schemas/investmentPortfolio';

class InvestmentPortfolioService extends BaseReadModelService {

  constructor(options = { scoped: true }) {
    super(InvestmentPortfolio, options);
  }


  async findInvestmentPortfolioByOwner(id) {
    const result = await this.findOne({ _id: id })
    return result;
  }


  async createInvestmentPortfolio({
    username,
    title,
    description,
    members,
    researches,
    lists,
    comments,
    metadata
  }) {

    const result = await this.createOne({
      _id: username,
      title: title || '',
      description: description || '',
      members: members || [],
      researches: researches || [],
      lists: lists || [{
        "id": "all",
        "name": "All",
        "color": "#757575"
      }],
      comments: comments || [],
      metadata: metadata || {}
    });

    return result;
  }


  async updateInvestmentPortfolio(username, {
    title,
    description,
    members,
    researches,
    lists,
    comments,
    metadata
  }) {

    const result = await this.updateOne({ _id: username }, {
      title,
      description,
      members,
      researches,
      lists,
      comments,
      metadata
    });

    return result;
  }


  async getSynchronizeInvestorPortfolio(username) {

    let investorPortfolio = await this.findInvestmentPortfolioByOwner(username);
    let shares = await deipRpc.api.getResearchTokensByAccountNameAsync(username);

    if (!investorPortfolio) {
      investorPortfolio = await this.createInvestmentPortfolio({ username, members: [{ username, role: "owner" }] });
    }

    let actual = shares.map(rt => rt.research_external_id);
    let saved = investorPortfolio.researches.map(r => r.id);
    actual.sort();
    saved.sort();

    if (JSON.stringify(actual) != JSON.stringify(saved)) {
      let actualResearches = [];

      // we need to recreate investments list instead of modifying the current one 
      // because of chain data drops 
      // and in case when all research tokens have been sold (transfered)
      for (let i = 0; i < actual.length; i++) {
        let researchId = actual[i];

        if (!saved.some(id => id == researchId)) {
          // new investment
          actualResearches.push({
            id: researchId,
            tags: [],
            memo: "",
            metadata: {}
          });
        } else {
          // existing investment
          let research = investorPortfolio.researches.find(r => r.id == researchId);
          actualResearches.push({
            id: research.id,
            tags: research.tags,
            memo: research.memo,
            metadata: research.metadata
          });
        }
      }

      investorPortfolio = await this.updateInvestmentPortfolio(username, { researches: actualResearches });
    }

    return investorPortfolio;
  }

  
}

export default InvestmentPortfolioService;