import deipRpc from '@deip/rpc-client';
import { EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';
import ResearchService from './research';
import ResearchGroupService from './researchGroup';
import ExpressLicensingService from './expressLicensing';
import usersService from './users';

class UserTransactionsService {

  constructor(tenant) {
    this.researchService = new ResearchService(tenant);
    this.researchGroupService = new ResearchGroupService();
    this.expressLicensingService = new ExpressLicensingService();
    this.usersService = usersService;
  }
  
  async getPendingExpressLisenceRequests(username) {
    const membershipTokens = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
    const requests1 = await this.expressLicensingService.getExpressLicenseRequestsByResearchGroups(membershipTokens.map(rgt => rgt.research_group.external_id)); // aprovers
    const requests2 = await this.expressLicensingService.getExpressLicenseRequestsByRequester(username); // requester

    const pendingRequests = [...requests1, ...requests2]
      .filter(r => r.status == EXPRESS_LICENSE_REQUEST_STATUS.PENDING)
      .reduce((unique, request) => {
        if (unique.some((r) => r._id.toString() == request._id.toString()))
          return unique;
        return [request, ...unique];
      }, []);
      
    return pendingRequests;
  }

  
  async getResolvedExpressLisenceRequests(username) {
    const membershipTokens = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
    const requests1 = await this.expressLicensingService.getExpressLicenseRequestsByResearchGroups(membershipTokens.map(rgt => rgt.research_group.external_id)); // aprovers
    const requests2 = await this.expressLicensingService.getExpressLicenseRequestsByRequester(username); // requester
    
    const approvedRequests = [...requests1, ...requests2]
      .filter(r => r.status == EXPRESS_LICENSE_REQUEST_STATUS.APPROVED || r.status == EXPRESS_LICENSE_REQUEST_STATUS.REJECTED)
      .reduce((unique, request) => {
        if (unique.some((r) => r._id.toString() == request._id.toString())) 
          return unique;
        return [request, ...unique];
      }, []);
    
    return approvedRequests;
  }


  async getPendingTransactions(username) {
    const expressLicensingTxs = await this.getPendingExpressLisenceRequests(username);

    const chainProposalsPromises = expressLicensingTxs.map(tx => deipRpc.api.getProposalAsync(tx._id));
    const chainProposals = await Promise.all(chainProposalsPromises);

    const chainExpressLicensingTxs = expressLicensingTxs
      .map(tx => {
        const proposal = chainProposals.find(p => p && p.external_id == tx._id);
        if (proposal) {
          return { ...tx, proposal };
        }
        return null;
      })
      .filter(tx => !!tx);

    const approvalsNames = chainExpressLicensingTxs.reduce((acc, tx) => {
      
      for (let i = 0; i < tx.proposal.required_active_approvals.length; i++) {
        let activeApprover = tx.proposal.required_active_approvals[i];
        if (!acc.some(a => a == activeApprover)) {
          acc.push(activeApprover);
        }
      }

      for (let i = 0; i < tx.proposal.required_owner_approvals.length; i++) {
        let ownerApprover = tx.proposal.required_owner_approvals[i];
        if (!acc.some(a => a == ownerApprover)) {
          acc.push(ownerApprover);
        }
      }

      for (let i = 0; i < tx.proposal.available_active_approvals.length; i++) {
        let activeApprover = tx.proposal.available_active_approvals[i];
        if (!acc.some(a => a == activeApprover)) {
          acc.push(activeApprover);
        }
      }

      for (let i = 0; i < tx.proposal.available_owner_approvals.length; i++) {
        let ownerApprover = tx.proposal.available_owner_approvals[i];
        if (!acc.some(a => a == ownerApprover)) {
          acc.push(ownerApprover);
        }
      }

      return acc;

    }, []);

    const chainAccounts = await deipRpc.api.getAccountsAsync(approvalsNames);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const researchGroups = await this.researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))
    const users = await this.usersService.getUsers(chainUserAccounts.map(a => a.name));

    return chainExpressLicensingTxs.map((tx) => {
      const extendedDetails = {
        
        requiredActiveApprovals: [...tx.proposal.required_active_approvals, ...tx.proposal.required_owner_approvals].map(a => {
          let userApprover = users.find(u => u.account.name == a);
          let researchGroupApprover = researchGroups.find(g => g.external_id == a);
          return userApprover ? userApprover : researchGroupApprover;
        }),

        availableActiveApprovals: [...tx.proposal.available_active_approvals, ...tx.proposal.available_owner_approvals].map(a => {
          let userApprover = users.find(u => u.account.name == a);
          let researchGroupApprover = researchGroups.find(g => g.external_id == a);
          return userApprover ? userApprover : researchGroupApprover;
        })
      }

      return { ...tx, proposal: { ...tx.proposal, extendedDetails } };
    })

  }

  async getAccountProposals(username) {
    const chainResearchGroups = await deipRpc.api.getResearchGroupsByMemberAsync(username);
    const signers = [ username, ...chainResearchGroups.map(rg => rg.external_id)];
    const allProposals = await deipRpc.api.getProposalsBySignersAsync(signers);
    const chainProposals = allProposals.reduce((unique, chainProposal) => {
      if (unique.some((p) => p.external_id == chainProposal.external_id))
        return unique;
      return [chainProposal, ...unique];
    }, []);

    let names = chainProposals.reduce((names, chainProposal) => {

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

    const researchGroups = await this.researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))
    const users = await this.usersService.getUsers(chainUserAccounts.map(a => a.name));

    const proposals = [];

    for (let i = 0; i < chainProposals.length; i++)
    {
      let chainProposal = chainProposals[i];
      let parties = {};
      
      for (let j = 0; j < chainProposal.required_approvals.length; j++)
      {
        let party = chainProposal.required_approvals[j];
        let key = `party${j+1}`;

        let chainAccount = chainAccounts.find(chainAccount => chainAccount.name == party);
        let ownerAuth = chainAccount.active.account_auths.map(([name, threshold]) => name);
        let activeAuth = chainAccount.owner.account_auths.map(([name, threshold]) => name);
        let members = [...ownerAuth, ...activeAuth].reduce((acc, name) => {
          if (!acc.some(n => n == name)) {
            return [...acc, name];
          }
          return [...acc];
        }, []);

        parties[key] = {
          isProposer: party == chainProposal.proposer,
          account: chainAccount.is_research_group ? researchGroups.find(rg => rg.external_id == party) : users.find(user => user.account.name == party),
          signers: [
            ...users.filter((u) => members.some(member => u.account.name == member) || u.account.name == party),
            ...researchGroups.filter((rg) => members.some(member => rg.external_id == member) || rg.external_id == party),
          ].map((signer) => {
            
            let approval = chainProposal.approvals.find(([name, txInfo]) => signer.account.is_research_group ? name == signer.external_id : name == signer.account.name);
            let reject = chainProposal.rejectors.find(([name, txInfo]) => signer.account.is_research_group ? name == signer.external_id : name == signer.account.name);

            let txInfo = reject ? reject[1] : approval ? approval[1] : null;
            return {
              signer: signer,
              txInfo: txInfo
            }
          })
        }
      }

      proposals.push({
        parties: parties,
        proposal: chainProposal,
        details: {}
      })
    }

    return proposals;

  }


  async getHistoryTransactions(username) {
    const expressLicensingTxs = await this.getResolvedExpressLisenceRequests(username);
    return [...expressLicensingTxs];
  }

}

export default UserTransactionsService;