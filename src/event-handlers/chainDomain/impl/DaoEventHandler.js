import { DOMAIN_EVENT } from '@casimir.one/platform-core';
import { TeamService, UserService } from '../../../services';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class DaoEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const daoEventHandler = new DaoEventHandler();
const userService = new UserService();
const teamService = new TeamService();


daoEventHandler.register(DOMAIN_EVENT.DAO_ALTER_AUTHORITY, async (event) => {
  console.log("CHAIN_DAO_ALTER_AUTHORITY", event.getEventPayload());
});

daoEventHandler.register(DOMAIN_EVENT.DAO_METADATA_UPDATED, async (event) => {
  console.log("CHAIN_DAO_METADATA_UPDATED", event.getEventPayload());
});

daoEventHandler.register(DOMAIN_EVENT.DAO_CREATE, async (event) => {
  console.log("EVENT CHAIN_DAO_CREATE", event.getEventPayload())
});


module.exports = daoEventHandler;
