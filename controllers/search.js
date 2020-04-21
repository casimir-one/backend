import deipRpc from '@deip/rpc-client';

const getAllResearchContents = async (ctx) => {
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    try {
        const researchList = await deipRpc.api.getAllResearchesListingAsync(0, 0);
        const contentList = [];

        for (let i = 0; i < researchList.length; i++) {
            const research = researchList[i];
            try {
                const researchContentList = await deipRpc.api.getAllResearchContentAsync(research.research_id);
                researchContentList.forEach(r => {
                    r.research_title = research.title;
                    r.group_permlink = research.group_permlink;
                    r.research_permlink = research.permlink;
                });
                contentList.push(...researchContentList);
            } catch (err) {
                console.log(err);
            }
        }
        
        ctx.status = 200
        ctx.body = contentList;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

export default {
    getAllResearchContents
}