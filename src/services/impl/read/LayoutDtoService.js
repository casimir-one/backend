import LayoutSchema from '../../../schemas/LayoutSchema';
import BaseService from '../../base/BaseService';

class LayoutDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(LayoutSchema, options);
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
 
}

export default LayoutDtoService;