import ProposalDtoService from './../../services/impl/read/ProposalDtoService';


const getAccountProposals = async (ctx) => {
  const status = ctx.params.status;
  const username = ctx.params.username;

  try {
    const proposalDtoService = new ProposalDtoService();
    let result = await proposalDtoService.getAccountProposals(username);
    result.sort(function (a, b) {
      return new Date(b.proposal.created_at) - new Date(a.proposal.created_at);
    });
    ctx.body = status && status != 0 ? result.filter(p => p.proposal.status == status) : result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getProposalById = async (ctx) => {
  const externalId = ctx.params.proposalExternalId;

  try {
    const proposalDtoService = new ProposalDtoService();
    const result = await proposalDtoService.getProposal(externalId);
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
    getAccountProposals,
    getProposalById
}