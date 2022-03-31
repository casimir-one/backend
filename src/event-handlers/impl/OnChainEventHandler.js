import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { AssetService, TeamService, UserService } from '../../services';
import { ChainService } from "@deip/chain-service";
import config from "../../config";


class OnChainEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainEventHandler = new OnChainEventHandler();
const userService = new UserService();
const teamService = new TeamService();

onChainEventHandler.register(APP_EVENT.CHAIN_BLOCK_CREATED, async (event) => {
  //
});

onChainEventHandler.register(APP_EVENT.CHAIN_PROJECT_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_CREATED", event);
  //
});

onChainEventHandler.register(APP_EVENT.CHAIN_DAO_CREATE, async (event) => {
  const chainService = await ChainService.getInstanceAsync(config);
  const { dao: { dao_key: address } } = event.getEventPayload();
  const daoId = await chainService.getChainRpc().getDaoIdByAddressAsync(address);
  //setting address to user-dao or team-dao
  const user = await userService.findOne({ _id: daoId });
  if (user) {
    await userService.updateOne({ _id: daoId }, { address });
    return;
  }

  const team = await teamService.findOne({ _id: daoId });
  if (team) {
    await teamService.updateOne({ _id: daoId }, { address });
  }
});


module.exports = onChainEventHandler;
