import deipRpc from '@deip/rpc-client';
import * as researchContentService from './../services/researchContent';
import { CHAIN_CONSTANTS } from './../constants';

const getAllResearchContents = async (ctx) => {
  const username = ctx.params.username;
  const tenant = ctx.state.tenant;

  try {

    const result = [];
    const chainResearches = await deipRpc.api.lookupResearchesAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
    const filtered = chainResearches
      .filter(r => !tenant.settings.researchWhitelist || tenant.settings.researchWhitelist.some(id => r.external_id == id))
      .filter(r => !tenant.settings.researchBlacklist || !tenant.settings.researchBlacklist.some(id => r.external_id == id))
      .filter(r => !r.is_private);

    const promises = filtered.map(r => deipRpc.api.getResearchContentsByResearchAsync(r.external_id));
    const all = await Promise.all(promises);
    const chainResearchContents = [].concat.apply([], all);
    const researchContents = await researchContentService.findResearchContents(chainResearchContents.map(rc => rc.external_id));

    for (let i = 0; i < researchContents.length; i++) {
      const researchContent = researchContents[i];
      const chainResearchContent = chainResearchContents.find(rc => rc.external_id == researchContent._id);
      const chainResearch = chainResearches.find(r => r.external_id == researchContent.researchExternalId);

      result.push({
        ...chainResearchContent,
        researchContentRef: researchContent,
        research_title: chainResearch.title,
        group_permlink: chainResearch.research_group.permlink,
        research_permlink: chainResearch.permlink,

        researchGroupExternalId: chainResearch.research_group.external_id,
        researchExternalId: chainResearch.external_id,
        researchContentExternalId: chainResearchContent.external_id
      });
    }

    ctx.status = 200
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

export default {
    getAllResearchContents
}