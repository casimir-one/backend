import deipRpc from '@deip/rpc-client';
import { CHAIN_CONSTANTS } from './../constants';

class DisciplinesService {
  async getDisciplines(disciplinesCount = CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT) {
    const disciplines = await deipRpc.api.lookupDisciplinesAsync(0, disciplinesCount);
    return disciplines;
  }
}

export default DisciplinesService;