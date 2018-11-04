import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findContentByHashOrId, lookupProposal, proposalIsNotExpired } from './../services/researchContent'
import { authorizeResearchGroup } from './../services/auth'


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