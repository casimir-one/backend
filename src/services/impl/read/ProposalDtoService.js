import BaseService from './../../base/BaseService';
import { APP_PROPOSAL, ProposalStatus } from '@casimir.one/platform-core';
import ProposalSchema from './../../../schemas/ProposalSchema';
import NFTCollectionDtoService from './NFTCollectionDtoService';
import TeamDtoService from './TeamDtoService';
import UserDtoService from './UserDtoService';
import config from './../../../config';
import { ChainService } from '@casimir.one/chain-service';

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const nftCollectionDtoService = new NFTCollectionDtoService({ scoped: false });


class ProposalDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }

  
  async mapProposals(proposals, extended = true) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainProposals = await Promise.all(proposals.map((proposal) => chainRpc.getProposalAsync(proposal._id)));

    const names = proposals.reduce((names, proposal) => {
      const chainProposal = chainProposals.filter((chainProposal) => !!chainProposal).find((chainProposal) => chainProposal.proposalId == proposal._id);
      
      if (!chainProposal)
        return names;

      if (!names.some((n) => n == chainProposal.creator)) {
        names.push(chainProposal.creator);
      }

      for (let i = 0; i < chainProposal.decisionMakers.length; i++) {
        let name = chainProposal.decisionMakers[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.approvers.length; i++) {
        const name = chainProposal.approvers[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.rejectors.length; i++) {
        const name = chainProposal.rejectors[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      return names;
    }, []);

    const chainAccounts = await chainRpc.getAccountsAsync(names);
    const teams = await teamDtoService.getTeams(names);
    const users = await userDtoService.getUsers(names);
    const result = [];


    for (let i = 0; i < proposals.length; i++) {
      const proposal = proposals[i];
      const chainProposal = chainProposals.filter((chainProposal) => !!chainProposal).find((chainProposal) => chainProposal.proposalId == proposal._id);
      if (!chainProposal) {
        console.warn(`Proposal with ID '${proposal._id}' is not found in the Chain`);
      }

      const parties = {};
      for (let j = 0; j < proposal.decisionMakers.length; j++) {
        const party = proposal.decisionMakers[j];
        const key = `party${j + 1}`;

        const chainAccount = chainAccounts.find(chainAccount => chainAccount.daoId == party);
        if (chainAccount) {
          const signatories = await this.getPossibleSignatories(chainAccount);
          const members = [...signatories];
          const possibleSigners = members.reduce((acc, name) => {
            if (!acc.some(n => n == name) && !proposal.decisionMakers.some(a => a == name)) {
              return [...acc, name];
            }
            return [...acc];
          }, []);

          let isApproved = members.some(member => proposal.approvers.some((name) => name == member)) || proposal.approvers.some((name) => name == party);
          let isRejected = members.some(member => proposal.rejectors.some((name) => name == member)) || proposal.rejectors.some((name) => name == party);
          let isHidden = false;

          parties[key] = {
            isProposer: party == proposal.creator,
            status: isApproved ? ProposalStatus.APPROVED : isRejected ? ProposalStatus.REJECTED : ProposalStatus.PENDING,
            account: users.find(user => user._id == party) || teams.find(team => team._id == party),
            isHidden,
            signers: [
              ...users.filter((user) => possibleSigners.some(member => user._id == member) || user._id == party),
              ...teams.filter((team) => possibleSigners.some(member => team._id == member) || team._id == party),
            ]
              .filter((signer) => {
                return proposal.approvers.some((name) => name == signer._id) || proposal.rejectors.some((name) => name == signer._id);
              })
              .map((signer) => {
                return {
                  signer: signer,
                  txInfo: null // TODO: move to event handler
                }
              })
          }
        }
      }

      result.push({
        _id: proposal._id,
        portalId: proposal.portalId,
        cmd: proposal.cmd,
        proposer: proposal.creator,
        parties: parties,
        type: proposal.type,
        status: chainProposal ? chainProposal.status : proposal.status,
        decisionMakers: chainProposal ? chainProposal.decisionMakers : proposal.decisionMakers,
        approvers: chainProposal ? chainProposal.approvers : proposal.approvers,
        rejectors: chainProposal ? chainProposal.rejectors : proposal.rejectors,

        // @deprecated
        entityId: proposal._id,
        details: proposal.details,
        proposal: chainProposal || null,
      })
    }

    if (!extended) 
      return result;

    try {
      // @deprecated
      const extendedProposals = await this.extendProposalsDetails(result);
      return extendedProposals;
    } catch(err) {
      console.error(err);
      return result;
    }

  }


  async getPossibleSignatories(account, checkAccounts = []) {
    const accounts = [];

    const members = [...account.authority.owner.auths.map((auth) => auth.daoId)]
      .filter(daoId => !checkAccounts.includes(daoId));

    if (members.length === 0) {
      return [];
    }

    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainAccounts = await chainRpc.getAccountsAsync(members);
    accounts.push(...members);

    for (let i = 0; i < chainAccounts.length; i++) {
      const chainAccount = chainAccounts[i];
      const team = await teamDtoService.getTeam(chainAccount.daoId);
      if (team) {
        const daoIds = await this.getPossibleSignatories(chainAccount, accounts);
        accounts.push(...daoIds);
      }
    }
    return [...accounts];
  }
  
  async extendProposalsDetails(proposals) {
    const result = [];
    const grouped = proposals.reduce((acc, proposal) => {
      acc[proposal.type] = acc[proposal.type] || [];
      acc[proposal.type].push(proposal);
      return acc;
    }, {});

    const tokenSwapsProposals = await this.extendTokenSwapProposals(grouped[APP_PROPOSAL.TOKENS_SWAP_PROPOSAL] || []);
    result.push(...tokenSwapsProposals);

    const ftTransfersProposals = await this.extendFTTransferProposals(grouped[APP_PROPOSAL.FT_TRANSFER_PROPOSAL] || []);
    result.push(...ftTransfersProposals);

    const nftTransfersProposals = await this.extendNFTTransferProposals(grouped[APP_PROPOSAL.NFT_TRANSFER_PROPOSAL] || []);
    result.push(...nftTransfersProposals);

    const teamUpdateProposals = await this.extendTeamUpdateProposals(grouped[APP_PROPOSAL.TEAM_UPDATE_PROPOSAL] || []);
    result.push(...teamUpdateProposals);

    return result;
  }

  async extendTokenSwapProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const party1 = teams.find(team => team._id == proposal.details.party1) || users.find(user => user._id == proposal.details.party1);
      const party2 = teams.find(team => team._id == proposal.details.party2) || users.find(user => user._id == proposal.details.party2);
      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    });
  }

  async extendFTTransferProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const party1 = teams.find(team => team._id == proposal.details.party1) || users.find(user => user._id == proposal.details.party1);
      const party2 = teams.find(team => team._id == proposal.details.party2) || users.find(user => user._id == proposal.details.party2);
      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    })
  }

  async extendNFTTransferProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const users = await userDtoService.getUsers(accountNames);
    const teams = await teamDtoService.getTeams(accountNames)

    return proposals.map((proposal) => {
      const party1 = teams.find(team => team._id == proposal.details.party1) || users.find(user => user._id == proposal.details.party1);
      const party2 = teams.find(team => team._id == proposal.details.party2) || users.find(user => user._id == proposal.details.party2);
      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    })
  }


  async extendTeamUpdateProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const teams = await teamDtoService.getTeams(accountNames);
    return proposals.map((proposal) => {
      const team = teams.find(team => team._id == proposal.details.teamId);
      const extendedDetails = { team };
      return { ...proposal, extendedDetails };
    });
  }


  async getAccountProposals(username) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainAccount = await chainRpc.getAccountAsync(username);
    const signatories = await this.getPossibleSignatories(chainAccount);
    const proposals = await this.findMany({ decisionMakers: { $in: [...signatories] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


  async getProposal(id) {
    const proposal = await this.findOne({ _id: id });
    if (!proposal) return null;
    const [result] = await this.mapProposals([proposal]);
    return result;
  }


  async getProposals(ids) {
    const proposals = await this.findMany({ _id: { $in: [...ids] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


}

export default ProposalDtoService;