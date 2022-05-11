import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectReviewEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectReviewEventHandler = new ProjectReviewEventHandler();


projectReviewEventHandler.register(DOMAIN_EVENT.PROJECT_REVIEW_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_REVIEW_CREATED", event.getEventPayload());
});

projectReviewEventHandler.register(DOMAIN_EVENT.PROJECT_REVIEW_UPVOTED, async (event) => {
  console.log("CHAIN_PROJECT_REVIEW_UPVOTED", event.getEventPayload());
});


module.exports = projectReviewEventHandler;
