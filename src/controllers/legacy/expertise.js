import qs from 'qs';
import ExpertiseService from './../../services/legacy/expertise';
import { UserDtoService } from './../../services';
import config from './../../config';
import { ChainService } from '@deip/chain-service';

const expertiseService = new ExpertiseService();

const getAccountEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const records = await chainRpc.getAccountEciHistoryAsync(
      username,
      0, // cursor
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getAccountEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {
    const userDtoService = new UserDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stat = await chainRpc.getAccountEciStatsAsync(
      username,
      filter.domain || undefined, 
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const user = await userDtoService.getUser(username);
    const result = { user, ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAccountsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const userDtoService = new UserDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stats = await chainRpc.getAccountsEciStatsAsync(
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const users = await Promise.all(stats.map(([name, stat]) => userDtoService.getUser(stat.account)));

    const result = stats.map(([name, stat], i) => {
      const user = users[i];
      return { user, ...stat };
    });

    result.sort((a, b) => b.eci - a.eci);

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const projectId = ctx.params.project;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const records = await chainRpc.getProjectEciHistoryAsync(
      projectId,
      0, // cursor
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const projectId = ctx.params.project;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stat = await chainRpc.getProjectEciStatsAsync(
      projectId,
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectesEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stats = await chainRpc.getProjectsEciStatsAsync(
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectContentEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const projectContentId = ctx.params.projectContent;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const records = await chainRpc.getProjectContentEciHistoryAsync(
      projectContentId,
      0, // cursor
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectContentEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const projectContentId = ctx.params.projectContent;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stat = await chainRpc.getProjectContentEciStatsAsync(
      projectContentId,
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getProjectContentsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const stats = await chainRpc.getProjectContentsEciStatsAsync(
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDomainEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getDomainEciHistoryAsync(
      filter.domain || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDomainsEciStatsHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getDomainsEciStatsHistoryAsync(
      filter.from || undefined,
      filter.to || undefined,
      filter.step || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDomainsEciLastStats = async (ctx) => {
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getDomainsEciLastStatsAsync();
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAccountExpertiseTokens = async (ctx) => {
  const username = ctx.params.username;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getExpertTokensByAccountNameAsync(username);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDomainExpertiseTokens = async (ctx) => {
  const domainId = ctx.params.domainId;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getExpertTokensByDomainAsync(domainId);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getEciHistoryByProjectContentAndDomain = async (ctx) => {
  const { contentId, domainId } = ctx.params;
  try {
    const history = await expertiseService.getEciHistoryByProjectContentAndDomain(contentId, domainId);
    if (!history) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = history;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByProject = async (ctx) => {
  const projectId = ctx.params.projectId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProject(projectId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByProjectAndDomain = async (ctx) => {
  const { projectId, domainId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProjectAndDomain(projectId, domainId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionByProjectContentAndDomain = async (ctx) => {
  const { contentId, domainId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionByProjectContentAndDomain(contentId, domainId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpertiseContributionsByProjectContent = async (ctx) => {
  const contentId = ctx.params.contentId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProjectContent(contentId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



export default {

  getAccountEciHistory,
  getAccountEciStats,
  getAccountsEciStats,

  getProjectEciHistory,
  getProjectEciStats,
  getProjectesEciStats,

  getProjectContentEciHistory,
  getProjectContentEciStats,
  getProjectContentsEciStats,

  getDomainEciHistory,
  getDomainsEciStatsHistory,
  getDomainsEciLastStats,

  getAccountExpertiseTokens,
  getDomainExpertiseTokens,
  getEciHistoryByProjectContentAndDomain,
  getExpertiseContributionsByProject,
  getExpertiseContributionsByProjectAndDomain,
  getExpertiseContributionByProjectContentAndDomain,
  getExpertiseContributionsByProjectContent
}