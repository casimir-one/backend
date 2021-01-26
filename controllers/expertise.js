import deipRpc from '@deip/rpc-client';
import qs from 'qs';
import UserService from './../services/users';


const getAccountEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {

    const records = await deipRpc.api.getAccountEciHistoryAsync(
      username,
      0, // cursor
      filter.discipline || undefined,
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
    const usersService = new UserService();

    const stat = await deipRpc.api.getAccountEciStatsAsync(
      username,
      filter.discipline || undefined, 
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const user = await usersService.getUser(username);
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
    const usersService = new UserService();
    const stats = await deipRpc.api.getAccountsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const users = await Promise.all(stats.map(([name, stat]) => usersService.getUser(stat.account)));

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


const getResearchEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {

    const records = await deipRpc.api.getResearchEciHistoryAsync(
      researchExternalId,
      0, // cursor
      filter.discipline || undefined,
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


const getResearchEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {

    const stat = await deipRpc.api.getResearchEciStatsAsync(
      researchExternalId,
      filter.discipline || undefined,
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


const getResearchesEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const stats = await deipRpc.api.getResearchesEciStatsAsync(
      filter.discipline || undefined,
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


const getResearchContentEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {

    const records = await deipRpc.api.getResearchContentEciHistoryAsync(
      researchContentExternalId,
      0, // cursor
      filter.discipline || undefined,
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


const getResearchContentEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {

    const stat = await deipRpc.api.getResearchContentEciStatsAsync(
      researchContentExternalId,
      filter.discipline || undefined,
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


const getResearchContentsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const stats = await deipRpc.api.getResearchContentsEciStatsAsync(
      filter.discipline || undefined,
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


const getDisciplineEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const result = await deipRpc.api.getDisciplineEciHistoryAsync(
      filter.discipline || undefined,
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


const getDisciplinesEciStatsHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const result = await deipRpc.api.getDisciplinesEciStatsHistoryAsync(
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


const getDisciplinesEciLastStats = async (ctx) => {
  try {
    const result = await deipRpc.api.getDisciplinesEciLastStatsAsync();
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
    const result = await deipRpc.api.getExpertTokensByAccountNameAsync(username);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


export default {

  getAccountEciHistory,
  getAccountEciStats,
  getAccountsEciStats,

  getResearchEciHistory,
  getResearchEciStats,
  getResearchesEciStats,

  getResearchContentEciHistory,
  getResearchContentEciStats,
  getResearchContentsEciStats,

  getDisciplineEciHistory,
  getDisciplinesEciStatsHistory,
  getDisciplinesEciLastStats,

  getAccountExpertiseTokens
}