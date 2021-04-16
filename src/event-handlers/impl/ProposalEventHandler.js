import BaseEventHandler from './../base/BaseEventHandler';
import { EVENT } from './../../constants';


class ProposalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const proposalEventHandler = new ProposalEventHandler();


proposalEventHandler.register(EVENT.PROPOSAL_CREATED, async (event, ctx) => {
  // TODO: handle proposal read schema 
  console.log(event);
});



module.exports = proposalEventHandler;