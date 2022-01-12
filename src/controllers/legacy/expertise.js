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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
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

    ctx.successRes(result);

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}


const getDomainsEciLastStats = async (ctx) => {
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getDomainsEciLastStatsAsync();
    ctx.successRes(result);
  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}


const getAccountExpertiseTokens = async (ctx) => {
  const username = ctx.params.username;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getExpertTokensByAccountNameAsync(username);
    ctx.successRes(result);
  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}


const getDomainExpertiseTokens = async (ctx) => {
  const domainId = ctx.params.domainId;
  try {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getExpertTokensByDomainAsync(domainId);
    ctx.successRes(result);
  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}

const getEciHistoryByProjectContentAndDomain = async (ctx) => {
  const { contentId, domainId } = ctx.params;
  try {
    const history = await expertiseService.getEciHistoryByProjectContentAndDomain(contentId, domainId);
    ctx.successRes(history);
  }
  catch(err) {
    console.log(err);
    ctx.errorRes(err);
  }
}

const getExpertiseContributionsByProject = async (ctx) => {
  const projectId = ctx.params.projectId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProject(projectId);
    ctx.successRes(expertise);
  }
  catch(err) {
    console.log(err);
    ctx.errorRes(err);
  }
}

const getExpertiseContributionsByProjectAndDomain = async (ctx) => {
  const { projectId, domainId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProjectAndDomain(projectId, domainId);
    ctx.successRes(expertise);
  }
  catch(err) {
    console.log(err);
    ctx.errorRes(err);
  }
}

const getExpertiseContributionByProjectContentAndDomain = async (ctx) => {
  const { contentId, domainId } = ctx.params;
  try {
    const expertise = await expertiseService.getExpertiseContributionByProjectContentAndDomain(contentId, domainId);
    ctx.successRes(expertise);
  }
  catch(err) {
    console.log(err);
    ctx.errorRes(err);
  }
}

const getExpertiseContributionsByProjectContent = async (ctx) => {
  const contentId = ctx.params.contentId;
  try {
    const expertise = await expertiseService.getExpertiseContributionsByProjectContent(contentId);
    ctx.successRes(expertise);
  }
  catch(err) {
    console.log(err);
    ctx.errorRes(err);
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