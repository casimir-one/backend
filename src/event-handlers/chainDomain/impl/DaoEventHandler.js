import { DOMAIN_EVENT } from '@deip/constants';
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
  const { dao: { dao_key: address, id } } = event.getEventPayload();
  const eventDaoId = Buffer.from(id).toString('hex');
  //setting address to user-dao or team-dao
  const user = await userService.findOne({ _id: eventDaoId });
  if (user) {
    await userService.updateOne({ _id: eventDaoId }, { address });
    return;
  }

  const team = await teamService.findOne({ _id: eventDaoId });
  if (team) {
    await teamService.updateOne({ _id: eventDaoId }, { address });
  }
});


module.exports = daoEventHandler;
