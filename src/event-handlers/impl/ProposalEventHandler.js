import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT } from './../../constants';


class ProposalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const proposalEventHandler = new ProposalEventHandler();


proposalEventHandler.register(APP_EVENT.PROPOSAL_CREATED, async (event, ctx) => {
  // TODO: handle proposalReadModel
  console.log(event);
});

proposalEventHandler.register(APP_EVENT.PROPOSAL_SIGNATURES_UPDATED, async (event, ctx) => {
  // TODO: handle proposalReadModel
  console.log(event);
});



module.exports = proposalEventHandler;