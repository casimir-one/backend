import InvestmentPortfolio from './../schemas/investmentPortfolio';
import deipRpc from '@deip/deip-rpc-client';

async function findInvestmentPortfolioByOwner(_id) {
  const investmentPortfolio = await InvestmentPortfolio.findOne({ _id })
  return investmentPortfolio;
}

async function createInvestmentPortfolio({ 
  username, 
  title, 
  description, 
  members, 
  researches, 
  lists, 
  comments, 
  metadata
}) {

  const investmentPortfolio = new InvestmentPortfolio({
    _id: username,
    title: title || '',
    description: description || '',
    members: members || [],
    researches: researches || [],
    lists: lists || [{
      "id": "all",
      "name": "All",
      "color": "#757575",
      "researches": []
    }],
    comments: comments || [],
    metadata: metadata || {}
  });

  const savedInvestmentPortfolio= await investmentPortfolio.save();
  return savedInvestmentPortfolio;
}

async function updateInvestmentPortfolio(username, {
  title,
  description,
  members,
  researches,
  lists,
  comments,
  metadata
}) {

  let investorPortfolio = await findInvestmentPortfolioByOwner(username);

  investorPortfolio.title = title;
  investorPortfolio.description = description;
  investorPortfolio.members = members;
  investorPortfolio.researches = researches;
  investorPortfolio.lists = lists;
  investorPortfolio.comments = comments;
  investorPortfolio.metadata = metadata;

  const updatedInvestmentPortfolio = await investorPortfolio.save();
  return updatedInvestmentPortfolio;
}

async function getSynchronizeInvestorPortfolio(username) {

  let investorPortfolio = await findInvestmentPortfolioByOwner(username);
  let shares = await deipRpc.api.getResearchTokensByAccountNameAsync(username);

  if (!investorPortfolio) {
    investorPortfolio = await createInvestmentPortfolio({ username, members: [{ username, role: "owner" }]});
  }

  let actual = shares.map(rt => rt.research_id);
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

    investorPortfolio.researches = actualResearches;

    // clear lists from old investments in case chain data is dropped 
    // or all research tokens have been sold (transfered) 
    // and add new investment to default list
    for (let i = 0; i < investorPortfolio.lists.length; i++) {
      let list = investorPortfolio.lists[i];

      for (let j = list.researches.length - 1; j >= 0; j--) {
        let rId = list.researches[j];
        if (!actualResearches.some(r => r.id == rId)) {
          list.researches.splice(j, 1);
        }
      }

      if (list.id == "all") {
        if (!list.researches.length == 0) {
          let toAdd = list.researches.filter(rId => !actualResearches.some(r => r.id == rId));
          list.researches.push(...toAdd);
        } else {
          let toAdd = actualResearches.map(r => r.id);
          list.researches.push(...toAdd);
        }
      }
    }

    investorPortfolio = await updateInvestmentPortfolio(username, investorPortfolio);
    console.log("Investor Portfolio Updated", JSON.stringify(investorPortfolio, null, 2));
  }

  return investorPortfolio;
}

export default {
  getSynchronizeInvestorPortfolio,  
  findInvestmentPortfolioByOwner,
  createInvestmentPortfolio,
  updateInvestmentPortfolio
}

