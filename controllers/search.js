import deipRpc from '@deip/rpc-client';
import * as researchContentService from './../services/researchContent';

const getAllResearchContents = async (ctx) => {
  const username = ctx.params.username;

  try {

    const result = [];
    const published = await researchContentService.findPublishedResearchContent();
    const chainResearchContents = await deipRpc.api.getResearchContentsAsync([...published.map(rc => rc._id)]);
    const uniqueResearches = published.reduce((acc, item) => {
      if (!acc.some(id => id == item.researchExternalId)) {
        return [...acc, item.researchExternalId]
      }
      return [...acc];
    }, []);
    
    const chainResearches = await deipRpc.api.getResearchesAsync([...uniqueResearches]);

    for (let i = 0; i < published.length; i++) {
      const publishedContent = published[i];
      const chainResearchContent = chainResearchContents.find(rc => rc.external_id == publishedContent._id);
      const chainResearch = chainResearches.find(r => r.external_id == publishedContent.researchExternalId);

      result.push({
        ...chainResearchContent,
        ref: publishedContent,
        research_title: chainResearch.title,
        group_permlink: chainResearch.research_group.permlink,
        research_permlink: chainResearch.permlink
      })
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