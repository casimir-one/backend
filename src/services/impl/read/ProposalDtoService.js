import BaseService from './../../base/BaseService';
import { APP_PROPOSAL } from '@deip/constants';
import ProposalSchema from './../../../schemas/ProposalSchema';
import { RESEARCH_STATUS } from './../../../constants';
import ProjectDtoService from './ProjectDtoService';
import TeamDtoService from './TeamDtoService';
import UserDtoService from './UserDtoService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const projectDtoService = new ProjectDtoService({ scoped: false });


class ProposalDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }

  
  async mapProposals(proposalsRefs, extended = true) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainProposals = await chainApi.getProposalsStatesAsync(proposalsRefs.map(p => p._id));

    const names = chainProposals.reduce((names, chainProposal) => {

      if (!names.some((n) => n == chainProposal.proposer)) {
        names.push(chainProposal.proposer);
      }

      for (let i = 0; i < chainProposal.required_approvals.length; i++) {
        let name = chainProposal.required_approvals[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.approvals.length; i++) {
        let [name, txInfo] = chainProposal.approvals[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      for (let i = 0; i < chainProposal.rejectors.length; i++) {
        let [name, txInfo] = chainProposal.rejectors[i];
        if (!names.some((n) => n == name)) {
          names.push(name);
        }
      }

      return names;
    }, []);


    const chainAccountsFromNames = await chainApi.getAccountsAsync(names);
    const chainAccounts = chainAccountsFromNames.filter(a => !!a);
    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const researchGroups = await teamDtoService.getTeams(chainResearchGroupAccounts.map(a => a.name))
    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));

    const proposals = [];

    for (let i = 0; i < chainProposals.length; i++) {
      let chainProposal = chainProposals[i];
      let proposerAccount = chainAccounts.find(a => a.name == chainProposal.proposer);
      let proposer = proposerAccount.is_research_group
        ? researchGroups.find(rg => rg.external_id == chainProposal.proposer)
        : users.find(u => u.account.name == chainProposal.proposer);

      let proposalRef = proposalsRefs.find(p => p._id == chainProposal.external_id);

      let parties = {};
      for (let j = 0; j < chainProposal.required_approvals.length; j++) {
        let party = chainProposal.required_approvals[j];
        let key = `party${j + 1}`;

        let chainAccount = chainAccounts.find(chainAccount => chainAccount.name == party);
        if (chainAccount) {
          const allAuth = await this.getAllAuth(chainAccount);
          let members = [...allAuth];
          let possibleSigners = members
            .reduce((acc, name) => {
              if (!acc.some(n => n == name) && !chainProposal.required_approvals.some(a => a == name)) {
                return [...acc, name];
              }
              return [...acc];
            }, []);

          let isApproved = members.some(member => chainProposal.approvals.some(([name,]) => name == member)) || chainProposal.approvals.some(([name,]) => name == party);

          let isRejected = members.some(member => chainProposal.rejectors.some(([name,]) => name == member)) || chainProposal.rejectors.some(([name,]) => name == party);

          let isHidden = false;

          /////////////// temp solution /////////////
          if (proposalRef.type == APP_PROPOSAL.PROJECT_NDA_PROPOSAL) {
            isHidden = researchGroups.some(({ tenantId }) => chainAccount.name === tenantId);
            if (!isApproved && !isRejected && chainProposal.status != 1) {
              const group = researchGroups.find(rg => rg.external_id == party);
              if (group.external_id == group.tenantId) {
                if (chainProposal.status == 3) isRejected = true;
                if (chainProposal.status == 2) isApproved = true;
              }
            }
          }

          /////////////// end temp solution /////////////

          parties[key] = {
            isProposer: party == chainProposal.proposer,
            status: isApproved ? 2 : isRejected ? 3 : 1,
            account: chainAccount.is_research_group ? researchGroups.find(rg => rg.external_id == party) : users.find(user => user.account.name == party),
            isHidden,
            signers: [
              ...users.filter((u) => possibleSigners.some(member => u.account.name == member) || u.account.name == party),
              ...researchGroups.filter((rg) => possibleSigners.some(member => rg.external_id == member) || rg.external_id == party),
            ]
              .filter((signer) => {
                let id = signer.account.is_research_group ? signer.external_id : signer.account.name;
                return chainProposal.approvals.some(([name, txInfo]) => name == id) || chainProposal.rejectors.some(([name, txInfo]) => name == id);
              })
              .map((signer) => {
                let id = signer.account.is_research_group ? signer.external_id : signer.account.name;

                let approval = chainProposal.approvals.find(([name, txInfo]) => name == id);
                let reject = chainProposal.rejectors.find(([name, txInfo]) => name == id);

                let txInfo = reject ? reject[1] : approval ? approval[1] : null;
                return {
                  signer: signer,
                  txInfo: txInfo
                }
              })
          }
        }
      }

      proposals.push({
        _id: proposalRef._id,
        entityId: proposalRef._id,
        cmd: proposalRef.cmd,
        proposer: proposer,
        parties: parties,
        proposal: chainProposal,
        type: proposalRef.type,
        details: proposalRef.details
      })
    }

    if (!extended) return proposals;

    const extendedProposals = await this.extendProposalsDetails(proposals);
    return extendedProposals;
  }

  async getAllAuth(account, checkAccounts = []) {
    const accounts = [];
    const activeAuth = account.active.account_auths.map(([name, threshold]) => name);
    const ownerAuth = account.owner.account_auths.map(([name, threshold]) => name);
    let members = [...activeAuth, ...ownerAuth];
    members = members.filter(acc => !checkAccounts.includes(acc));
    if (members.length === 0) {
      return [];
    }

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(members);
    accounts.push(...members)

    for(let i = 0; i < chainAccounts.length; i++) {
      if (chainAccounts[i].is_research_group) {
        const accountsNames = await this.getAllAuth(chainAccounts[i], accounts)
        accounts.push(...accountsNames);
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

    const contractAgreementContracts = await this.extendContractAgreementProposals(grouped[APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL] || []);
    result.push(...contractAgreementContracts);

    const assetExchangesProposals = await this.extendAssetExchangeProposals(grouped[APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL] || []);
    result.push(...assetExchangesProposals);

    const assetTransfersProposals = await this.extendAssetTransferProposals(grouped[APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL] || []);
    result.push(...assetTransfersProposals);

    const researchProposals = await this.extendResearchProposals(grouped[APP_PROPOSAL.PROJECT_PROPOSAL] || []);
    result.push(...researchProposals);

    const researchUpdateProposals = await this.extendResearchUpdateProposals(grouped[APP_PROPOSAL.PROJECT_UPDATE_PROPOSAL] || []);
    result.push(...researchUpdateProposals);

    const researchGroupUpdateProposals = await this.extendResearchGroupUpdateProposals(grouped[APP_PROPOSAL.TEAM_UPDATE_PROPOSAL] || []);
    result.push(...researchGroupUpdateProposals);

    const researchContentProposals = await this.extendResearchContentProposals(grouped[APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL] || []);
    result.push(...researchContentProposals);

    const researchTokenSaleProposals = await this.extendResearchTokenSaleProposals(grouped[APP_PROPOSAL.PROJECT_FUNDRASE_PROPOSAL] || []);
    result.push(...researchTokenSaleProposals);

    const userInvitationProposals = await this.extendUserInvitationProposals(grouped[APP_PROPOSAL.PROJECT_INVITE_PROPOSAL] || []);
    result.push(...userInvitationProposals);

    const userResignationProposals = await this.extendUserResignationProposals(grouped[APP_PROPOSAL.PROJECT_LEAVE_PROPOSAL] || []);
    result.push(...userResignationProposals);

    const researchNdaProposals = await this.extendResearchNdaProposals(grouped[APP_PROPOSAL.PROJECT_NDA_PROPOSAL] || []);
    result.push(...researchNdaProposals);

    return result;
  }


  async extendContractAgreementProposals(requests) {
    const accountNames = requests.reduce((acc, req) => {
      if (!acc.some(a => a == req.details.creator)) {
        acc.push(req.details.creator);
      }
      return acc;
    }, []);

    const projectIds = requests.reduce((acc, req) => {
      if (!acc.some(r => r == req.details.projectId)) {
        acc.push(req.details.projectId);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(accountNames);
    const chainResearches = await chainApi.getProjectsAsync(projectIds);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    // currently we allow to buy the license only for user account
    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));
    const researches = await projectDtoService.getProjects(chainResearches.map(r => r.external_id), Object.values(RESEARCH_STATUS));

    return requests.map((req) => {
      const extendedDetails = {
        requester: users.find(u => u.account.name == req.details.creator),
        research: researches.find(r => r.external_id == req.details.projectId)
      }
      return { ...req, extendedDetails };
    })
  }

  async extendAssetExchangeProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await teamDtoService.getTeams(chainResearchGroupAccounts.map(a => a.name))

    return proposals.map((proposal) => {
      const party1Account = chainAccounts.find(a => a.name == proposal.details.party1);
      const party2Account = chainAccounts.find(a => a.name == proposal.details.party2);

      const party1 = party1Account.is_research_group 
        ? researchGroups.find(rg => rg.external_id == proposal.details.party1) 
        : users.find(u => u.account.name == proposal.details.party1);

      const party2 = party2Account.is_research_group
        ? researchGroups.find(rg => rg.external_id == proposal.details.party2)
        : users.find(u => u.account.name == proposal.details.party2);

      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    })
  }

  async extendAssetTransferProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.party1)) {
        acc.push(proposal.details.party1);
      }
      if (!acc.some(a => a == proposal.details.party2)) {
        acc.push(proposal.details.party2);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await teamDtoService.getTeams(chainResearchGroupAccounts.map(a => a.name))

    return proposals.map((proposal) => {
      const party1Account = chainAccounts.find(a => a.name == proposal.details.party1);
      const party2Account = chainAccounts.find(a => a.name == proposal.details.party2);

      const party1 = party1Account.is_research_group
        ? researchGroups.find(rg => rg.external_id == proposal.details.party1)
        : users.find(u => u.account.name == proposal.details.party1);

      const party2 = party2Account.is_research_group
        ? researchGroups.find(rg => rg.external_id == proposal.details.party2)
        : users.find(u => u.account.name == proposal.details.party2);

      const extendedDetails = { party1, party2 };
      return { ...proposal, extendedDetails };
    })
  }

  async extendResearchProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const researchGroups = await teamDtoService.getTeams(accountNames.map(a => a));

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const extendedDetails = { researchGroup };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchUpdateProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const researchExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.projectId)) {
        acc.push(proposal.details.projectId);
      }
      return acc;
    }, []);

    const researchGroups = await teamDtoService.getTeams(accountNames.map(a => a));
    const researches = await projectDtoService.getProjects(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.teamId);
      const research = researches.find(r => r.external_id == proposal.details.projectId);
      const extendedDetails = { researchGroup, research };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchGroupUpdateProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const researchGroups = await teamDtoService.getTeams(accountNames.map(a => a));

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const extendedDetails = { researchGroup };
      return { ...proposal, extendedDetails };
    });
  }


  async extendResearchContentProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const researchExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchExternalId)) {
        acc.push(proposal.details.researchExternalId);
      }
      return acc;
    }, []);

    const researchGroups = await teamDtoService.getTeams(accountNames.map(a => a));
    const researches = await projectDtoService.getProjects(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const research = researches.find(r => r.external_id == proposal.details.researchExternalId);
      const extendedDetails = { researchGroup, research };
      return { ...proposal, extendedDetails };
    });
  }

  async extendResearchTokenSaleProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);

    const researchExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchExternalId)) {
        acc.push(proposal.details.researchExternalId);
      }
      return acc;
    }, []);

    const researchTokenSaleExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchTokenSaleExternalId)) {
        acc.push(proposal.details.researchTokenSaleExternalId);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const researchGroups = await teamDtoService.getTeams(accountNames.map(a => a));
    const researches = await projectDtoService.getProjects(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));
    const researchTokenSales = await Promise.all(researchTokenSaleExternalIds.map(id => chainApi.getProjectTokenSaleAsync(id)));


    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const research = researches.find(r => r.external_id == proposal.details.researchExternalId);
      const researchTokenSale = researchTokenSales.find(ts => ts.external_id == proposal.details.researchTokenSaleExternalId);

      const extendedDetails = { researchGroup, research, researchTokenSale };
      return { ...proposal, extendedDetails };
    });
  }


  async extendUserInvitationProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.invitee)) {
        acc.push(proposal.details.invitee);
      }
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await teamDtoService.getTeams(chainResearchGroupAccounts.map(a => a.name))

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.teamId);
      const invitee = users.find(a => a.account.name == proposal.details.invitee);
      const extendedDetails = { researchGroup, invitee };
      return { ...proposal, extendedDetails };
    });
  }


  async extendUserResignationProposals(proposals) {
    const accountNames = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.member)) {
        acc.push(proposal.details.member);
      }
      if (!acc.some(a => a == proposal.details.teamId)) {
        acc.push(proposal.details.teamId);
      }
      return acc;
    }, []);

    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAccounts = await chainApi.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await userDtoService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await teamDtoService.getTeams(chainResearchGroupAccounts.map(a => a.name))

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const member = users.find(a => a.account.name == proposal.details.member);
      const extendedDetails = { researchGroup, member };
      return { ...proposal, extendedDetails };
    });

  }

  async extendResearchNdaProposals(proposals) {
    const projectIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.projectId)) {
        acc.push(proposal.details.projectId);
      }
      return acc;
    }, []);

    const researches = await projectDtoService.getProjects(projectIds.map(rId => rId), Object.values(RESEARCH_STATUS));

    return proposals.map(proposal => {
      const research = researches.find(r => r.external_id == proposal.details.projectId);
      return { ...proposal, extendedDetails: { research } };
    })
  }

  
  async getAccountProposals(username) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const teamsRefs = await chainApi.getTeamReferencesAsync([username], false);
    const [teamsIds] = teamsRefs.map((g) => g.map(m => m.team));
    const signers = [username, ...teamsIds];
    const allProposals = await chainApi.getProposalsBySignersAsync(signers);
    const externalIds = allProposals.reduce((unique, chainProposal) => {
      if (unique.some((id) => id == chainProposal.external_id))
        return unique;
      return [chainProposal.external_id, ...unique];
    }, []);

    const proposals = await this.findMany({ _id: { $in: [...externalIds] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


  async getProposal(externalId) {
    const proposal = await this.findOne({ _id: externalId });
    if (!proposal) return null;
    const [result] = await this.mapProposals([proposal]);
    return result;
  }


  async getProposals(externalIds) {
    const proposals = await this.findMany({ _id: { $in: [...externalIds] } });
    const result = await this.mapProposals(proposals);
    return result;
  }


}

export default ProposalDtoService;