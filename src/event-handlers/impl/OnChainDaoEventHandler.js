import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { TeamService, UserService } from '../../services';


class OnChainDaoEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainDaoEventHandler = new OnChainDaoEventHandler();
const userService = new UserService();
const teamService = new TeamService();


onChainDaoEventHandler.register(APP_EVENT.CHAIN_DAO_ALTER_AUTHORITY, async (event) => {
  console.log("CHAIN_DAO_ALTER_AUTHORITY", event.getEventPayload());
});

onChainDaoEventHandler.register(APP_EVENT.CHAIN_DAO_METADATA_UPDATED, async (event) => {
  console.log("CHAIN_DAO_METADATA_UPDATED", event.getEventPayload());
});

onChainDaoEventHandler.register(APP_EVENT.CHAIN_DAO_CREATE, async (event) => {
  console.log("EVENT CHAIN_DAO_CREATE", event.getEventPayload())
  const { dao: { dao_key: address, id } } = event.getEventPayload();
  const eventDaoId = Buffer.from(id).toString('hex');
  //setting address to user-dao or team-dao
  const user = await userService.findOne({ _id: eventDaoId });
  if (user) {
    await userService.updateOne({ _id: eventDaoId }, { address });
    console.log("CHAIN HANDLER DAO_CREATE success, USER UPDATED")
    return;
  }

  const team = await teamService.findOne({ _id: eventDaoId });
  if (team) {
    console.log("CHAIN HANDLER DAO_CREATE success, TEAM UPDATED")
    await teamService.updateOne({ _id: eventDaoId }, { address });
  }
  console.log("CHAIN HANDLER DAO_CREATE, NOTHINGS UPDATED")
});


module.exports = onChainDaoEventHandler;
