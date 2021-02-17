import config from './../config';
import * as blockchainService from './../utils/blockchain';
import ResearchNdaProposedEvent from './../events/researchNdaProposedEvent';
import ResearchNdaProposalSignedEvent from './../events/researchNdaProposalSignedEvent';
import ResearchNdaService from './../services/researchNda';

const researchNdaService = new ResearchNdaService();


const createResearchNonDisclosureAgreement = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {
    
    const txInfo = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const researchNdaProposedEvent = new ResearchNdaProposedEvent(datums, offchainMeta);
    ctx.state.events.push(researchNdaProposedEvent);

    const researchNdaApprovals = researchNdaProposedEvent.getProposalApprovals();
    for (let i = 0; i < researchNdaApprovals.length; i++) {
      const approval = researchNdaApprovals[i];
      const researchNdaProposalSignedEvent = new ResearchNdaProposalSignedEvent([approval]);
      ctx.state.events.push(researchNdaProposalSignedEvent);
    }

    const tenantApprovalTx = await blockchainService.signOperations([['update_proposal', {
      external_id: researchNdaProposedEvent.getProposalId(),
      active_approvals_to_add: [],
      active_approvals_to_remove: [],
      owner_approvals_to_add: [config.TENANT],
      owner_approvals_to_remove: [],
      key_approvals_to_add: [],
      key_approvals_to_remove: [],
      extensions: []
    }]], config.TENANT_PRIV_KEY);

    const txInfo2 = await blockchainService.sendTransactionAsync(tenantApprovalTx);
    const researchNdaProposalSignedEvent = new ResearchNdaProposalSignedEvent(blockchainService.extractOperations(tenantApprovalTx));
    ctx.state.events.push(researchNdaProposalSignedEvent);

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const getResearchNonDisclosureAgreement = async (ctx) => {
  const externalId = ctx.params.ndaExternalId;
  try {
    const result = await researchNdaService.getResearchNda(externalId);
    if (!result) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = result;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchNonDisclosureAgreementsByCreator = async (ctx) => {
  const creator = ctx.params.username;
  try {
    const result = await researchNdaService.getResearchNdaListByCreator(creator);
    ctx.body = result;
    ctx.status = 200;
  }
  catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchNonDisclosureAgreementsByHash = async (ctx) => {
  const hash = ctx.params.hash;
  try {
    const result = await researchNdaService.getResearchNdaListByHash(hash);
    ctx.body = result;
    ctx.status = 200;
  }
  catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchNonDisclosureAgreementsByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  try {
    const result = await researchNdaService.getResearchNdaListByResearch(researchExternalId);
    ctx.body = result;
    ctx.status = 200;
  }
  catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {
  createResearchNonDisclosureAgreement,
  getResearchNonDisclosureAgreement,
  getResearchNonDisclosureAgreementsByCreator,
  getResearchNonDisclosureAgreementsByHash,
  getResearchNonDisclosureAgreementsByResearch
}