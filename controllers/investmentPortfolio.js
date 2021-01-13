import InvestmentPortfolioService from './../services/investmentPortfolio';


const getUserInvestmentPortfolio = async (ctx) => {
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  const investmentPortfolioService = new InvestmentPortfolioService();
  const investmentPortfolio = await investmentPortfolioService.getSynchronizeInvestorPortfolio(username);

  if (!investmentPortfolio.members.some(m => m.username == jwtUsername)) {
    ctx.status = 403;
    ctx.body = `You have no permission to view '${username}' investment portfolio`;
    return;
  }

  ctx.status = 200;
  ctx.body = investmentPortfolio;
}

const updateInvestmentPortfolio = async (ctx) => {
  const data = ctx.request.body;
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  const investmentPortfolioService = new InvestmentPortfolioService();
  const investmentPortfolio = await investmentPortfolioService.getSynchronizeInvestorPortfolio(username);
  
  if (!investmentPortfolio.members.some(m => m.username == jwtUsername)) {
    ctx.status = 403;
    ctx.body = `You have no permission to view '${username}' investment portfolio`;
    return;
  }

  const updatedInvestmentPortfolio = await investmentPortfolioService.updateInvestmentPortfolio(username, data);

  ctx.status = 200;
  ctx.body = updatedInvestmentPortfolio
}

export default {
  getUserInvestmentPortfolio,
  updateInvestmentPortfolio
}