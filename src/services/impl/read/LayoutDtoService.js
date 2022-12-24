import LayoutSchema from '../../../schemas/LayoutSchema';
import BaseService from '../../base/BaseService';

class LayoutDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(LayoutSchema, options);
  }

  async mapDTOs(layouts) {
    return layouts.map((layout) => {
      return { ...layout };
    })
  }

  async getLayout(id) {
    const layout = await this.findOne({ _id: id });
    return layout;
  }

  async getLayouts() {
    const layouts = await this.findMany();
    return layouts;
  }

  async getLayoutsByScope(scope) {
    const layouts = await this.findMany({ scope });
    return layouts;
  }

  async getLayoutsDTOsPaginated(filter, sort, pagination) {
    const f = filter || {};
    const { paginationMeta, result: layouts } = await this.findManyPaginated(f, sort, pagination);
    const result = await this.mapDTOs(layouts);
    return { paginationMeta, result };
  }

}

export default LayoutDtoService;