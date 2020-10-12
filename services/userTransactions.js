import deipRpc from '@deip/rpc-client';
import { EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';
import ResearchService from './research';
import ResearchGroupService from './researchGroup';
import ExpressLicensingService from './expressLicensing';

class UserTransactionsService {

  constructor(tenant) {
    this.researchService = new ResearchService(tenant);
    this.researchGroupService = new ResearchGroupService();
    this.expressLicensingService = new ExpressLicensingService();
  }
  
  async getPendingExpressLisenceRequests(username) {
    const membershipTokens = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
    const requests = await this.expressLicensingService.getExpressLicenseRequestsByResearchGroups(membershipTokens.map(rgt => rgt.research_group.external_id)); // aprovers
    const pendingRequests = requests.filter(r => r.status == EXPRESS_LICENSE_REQUEST_STATUS.PENDING);
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
      .filter(tx => !!tx)

    return [...chainExpressLicensingTxs];
  }


  async getHistoryTransactions(username) {
    const expressLicensingTxs = await this.getResolvedExpressLisenceRequests(username);
    return [...expressLicensingTxs];
  }

}

export default UserTransactionsService;