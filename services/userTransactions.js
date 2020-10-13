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

    const requiredApprovals = chainExpressLicensingTxs.reduce((acc, tx) => {
      
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

      return acc;

    }, []);

    const chainAccounts = await deipRpc.api.getAccountsAsync(requiredApprovals);

    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const researchGroups = await this.researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))
    const users = await this.usersService.getUsers(chainUserAccounts.map(a => a.name));

    return chainExpressLicensingTxs.map((tx) => {
      const extendedDetails = {
        requiredActiveApprovals: tx.proposal.required_active_approvals.map(a => {
          let userApprover = users.find(u => u.account.name == a);
          let researchGroupApprover = researchGroups.find(g => g.external_id == a);
          return userApprover ? userApprover : researchGroupApprover;
        })
      }

      return { ...tx, proposal: { ...tx.proposal, extendedDetails } };
    })
    
  }


  async getHistoryTransactions(username) {
    const expressLicensingTxs = await this.getResolvedExpressLisenceRequests(username);
    return [...expressLicensingTxs];
  }

}

export default UserTransactionsService;