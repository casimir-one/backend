import { APP_EVENT, INVESTMENT_OPPORTUNITY_STATUS } from '@deip/constants';
import { InvestmentOpportunityParticipationService, InvestmentOpportunityService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';


class InvestmentOpportunityEventHandler extends PortalAppEventHandler {
  constructor() {
    super();
  }
}

const invstOppEventHandler = new InvestmentOpportunityEventHandler();
const invstOppService = new InvestmentOpportunityService();
const invstOppParticipationService = new InvestmentOpportunityParticipationService();

invstOppEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, async (event) => {
  const {
    investmentOpportunityId,
    teamId,
    projectId,
    startTime,
    endTime,
    shares,
    softCap,
    hardCap,
    creator,
    title,
    metadata
  } = event.getEventPayload();

  await invstOppService.createInvstOpp({
    invstOppId: investmentOpportunityId,
    teamId,
    projectId,
    startTime,
    endTime,
    shares,
    softCap,
    hardCap,
    creator,
    title,
    totalInvested: {
      ...softCap,
      amount: '0'
    },
    metadata,
    status: INVESTMENT_OPPORTUNITY_STATUS.INACTIVE
  });
});


invstOppEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED, async (event) => {
  const {
    investmentOpportunityId,
    investor,
    asset
  } = event.getEventPayload();

  const timestamp = new Date().getTime();

  const invstOpp = await invstOppService.getInvstOpp(investmentOpportunityId);

  const updatedData = {
    totalInvested: {
      ...invstOpp.totalInvested,
      amount: `${Number(invstOpp.totalInvested.amount) + Number(asset.amount)}`
    }
  };

  if (Number(updatedData.totalInvested.amount) >= Number(invstOpp.hardCap.amount)) {
    updatedData.totalInvested.amount = invstOpp.hardCap.amount;
    updatedData.status = INVESTMENT_OPPORTUNITY_STATUS.FINISHED;
  }

  await invstOppService.updateInvstOpp({
    _id: investmentOpportunityId,
    ...updatedData
  })

  await invstOppParticipationService.createInvstOppParticipation({
    investmentOpportunityId,
    investor,
    asset,
    timestamp,
    projectId: invstOpp.projectId
  });
});


module.exports = invstOppEventHandler;