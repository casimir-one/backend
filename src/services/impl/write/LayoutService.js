import BaseService from '../../base/BaseService';
import LayoutSchema from '../../../schemas/LayoutSchema';

class LayoutService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(LayoutSchema, options);
  }

  async createLayout({
    name,
    value,
    scope,
    type
  }) {
    const layout = await this.createOne({
      name,
      value,
      scope,
      type
    });

    return layout;
  }

  async updateLayout({
    _id: id,
    name,
    value
  }) {
    const updatedLayout = this.updateOne({ _id: id }, {
      name,
      value
    });

    return updatedLayout;
  }

  async deleteLayout(id) {
    const deletedLayout = await this.deleteOne({ _id: id});
    return deletedLayout;
  }

  async getLayout(id) {
    const layout = await this.findOne({ _id: id });
    return layout;
  }
}

export default LayoutService;