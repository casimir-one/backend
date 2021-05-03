import deipRpc from '@deip/rpc-client';
import BaseService from './../../base/BaseService';
import { APP_PROPOSAL } from '@deip/command-models';
import ProposalSchema from './../../../schemas/write/ProposalSchema';
import { RESEARCH_STATUS } from './../../../constants';
import ResearchService from './../../../services/impl/read/ProjectDtoService';
import ResearchGroupService from './../../../services/legacy/researchGroup';
import UserService from './../../../services/legacy/users';


const usersService = new UserService({ scoped: false });
const researchGroupService = new ResearchGroupService({ scoped: false });
const researchService = new ResearchService({ scoped: false });


class ProposalDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }

  
  async mapProposals(proposalsRefs, extended = true) {

    const chainProposals = await deipRpc.api.getProposalsStatesAsync(proposalsRefs.map(p => p._id));

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


    const chainAccounts = await deipRpc.api.getAccountsAsync(names);
    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const researchGroups = await researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))
    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));

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

      proposals.push({
        _id: proposalRef._id,
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

    const chainAccounts = await deipRpc.api.getAccountsAsync(members);
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

    const licenseRequests = await this.extendExpressLicenseRequests(grouped[APP_PROPOSAL.EXPRESS_LICENSE_PROPOSAL] || []);
    result.push(...licenseRequests);

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


  async extendExpressLicenseRequests(requests) {
    const accountNames = requests.reduce((acc, req) => {
      if (!acc.some(a => a == req.details.licensee)) {
        acc.push(req.details.licensee);
      }
      return acc;
    }, []);

    const researchExternalIds = requests.reduce((acc, req) => {
      if (!acc.some(r => r == req.details.researchExternalId)) {
        acc.push(req.details.researchExternalId);
      }
      return acc;
    }, []);

    const chainAccounts = await deipRpc.api.getAccountsAsync(accountNames);
    const chainResearches = await deipRpc.api.getResearchesAsync(researchExternalIds);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    // currently we allow to buy the license only for user account
    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));
    const researches = await researchService.getResearches(chainResearches.map(r => r.external_id), Object.values(RESEARCH_STATUS));

    return requests.map((req) => {
      const extendedDetails = {
        requester: users.find(u => u.account.name == req.details.licensee),
        research: researches.find(r => r.external_id == req.details.researchExternalId)
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

    const chainAccounts = await deipRpc.api.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))

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

    const chainAccounts = await deipRpc.api.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))

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

    const researchGroups = await researchGroupService.getResearchGroups(accountNames.map(a => a));

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

    const researchGroups = await researchGroupService.getResearchGroups(accountNames.map(a => a));
    const researches = await researchService.getResearches(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));

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

    const researchGroups = await researchGroupService.getResearchGroups(accountNames.map(a => a));

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

    const researchGroups = await researchGroupService.getResearchGroups(accountNames.map(a => a));
    const researches = await researchService.getResearches(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));

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


    const researchGroups = await researchGroupService.getResearchGroups(accountNames.map(a => a));
    const researches = await researchService.getResearches(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));
    const researchTokenSales = await Promise.all(researchTokenSaleExternalIds.map(id => deipRpc.api.getResearchTokenSaleAsync(id)));


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

    const chainAccounts = await deipRpc.api.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))

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
      if (!acc.some(a => a == proposal.details.researchGroupExternalId)) {
        acc.push(proposal.details.researchGroupExternalId);
      }
      return acc;
    }, []);


    const chainAccounts = await deipRpc.api.getAccountsAsync(accountNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const users = await usersService.getUsers(chainUserAccounts.map(a => a.name));
    const researchGroups = await researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))

    return proposals.map((proposal) => {
      const researchGroup = researchGroups.find(a => a.account.name == proposal.details.researchGroupExternalId);
      const member = users.find(a => a.account.name == proposal.details.member);
      const extendedDetails = { researchGroup, member };
      return { ...proposal, extendedDetails };
    });

  }

  async extendResearchNdaProposals(proposals) {
    const researchExternalIds = proposals.reduce((acc, proposal) => {
      if (!acc.some(a => a == proposal.details.researchExternalId)) {
        acc.push(proposal.details.researchExternalId);
      }
      return acc;
    }, []);

    const researches = await researchService.getResearches(researchExternalIds.map(rId => rId), Object.values(RESEARCH_STATUS));

    return proposals.map(proposal => {
      const research = researches.find(r => r.external_id == proposal.details.researchExternalId);
      return { ...proposal, extendedDetails: { research } };
    })
  }



  async getAccountProposals(username) {
    const chainResearchGroups = await deipRpc.api.getResearchGroupsByMemberAsync(username);
    const signers = [username, ...chainResearchGroups.map(rg => rg.external_id)];
    const allProposals = await deipRpc.api.getProposalsBySignersAsync(signers);
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