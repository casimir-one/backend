import deipRpc from '@deip/rpc-client';
import { CHAIN_CONSTANTS, DISCIPLINES } from './../constants';

class DisciplinesService {
  async getDomainDisciplines(disciplinesCount = CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT, excluded = DISCIPLINES.EXCLUDED) {
    const disciplines = await deipRpc.api.lookupDisciplinesAsync(0, disciplinesCount);
    return disciplines.filter(d => !excluded.includes(d.external_id));
  }
}

export default DisciplinesService;