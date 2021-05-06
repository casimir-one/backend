import assert from 'assert';
import config from './../../config';
import TenantSchema from './../../schemas/TenantSchema';


class BaseService {

  _schema = undefined;
  _tenantProfile = undefined;
  _scoped = undefined;

  constructor(schema, options = { scoped: true }) {
    assert(schema != null, "Service read model schema is not defined");
    this._schema = schema;
    this._scoped = options.scoped;
  }


  async getTenantInstance() {
    if (this._tenantProfile === undefined) {
      const tenantProfile = await TenantSchema.findOne({ _id: config.TENANT });
      if (!tenantProfile) {
        throw new Error(`Tenant ${config.TENANT} is not found`);
      }
      this._tenantProfile = tenantProfile.toObject();
    }

    return this._tenantProfile;
  }


  async getBaseScopeQuery() {
    const tenantProfile = await this.getTenantInstance();
    if (!this._scoped) return {};

    if (tenantProfile.network.scope.length) {
      const isAll = tenantProfile.network.scope.some(s => s == 'all');
      if (isAll) { // temp solution until access management implementation
        const tenants = await TenantSchema.find({});
        return { $or: [{ tenantId: { $in: [...tenants.map(t => t._id.toString())] } }, { multiTenantIds: { $in: [...tenants.map(t => t._id.toString())] } }] };
      } else {
        return { $or: [{ tenantId: { $in: [...tenantProfile.network.scope] } }, { multiTenantIds: { $in: [...tenantProfile.network.scope] } }] };
      }
    } else {
      return { $or: [{ tenantId: { $in: [tenantProfile._id] } }, { multiTenantIds: { $in: [tenantProfile._id] } }] };
    }
  }


  async findOne(searchQuery) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await this._schema.findOne({ ...searchQuery, ...scopeQuery });
    return result ? result.toObject() : null;
  }


  async findMany(searchQuery) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await this._schema.find({ ...searchQuery, ...scopeQuery });
    return [...result.map(r => r.toObject())];
  }


  async createOne(fields) {
    const keys = Object.keys(fields);
    const payload = {};
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = fields[key];
      if (value !== undefined)
        payload[key] = value;
    }

    const tenantProfile = await this.getTenantInstance();
    payload.tenantId = tenantProfile._id;

    const savedModel = await this._schema.create(payload);
    return savedModel.toObject();
  }


  async createMany(objects) {
    const payloads = [];
    const tenantProfile = await this.getTenantInstance();

    for (let i = 0; i < objects.length; i++) {
      const fields = objects[i];

      const keys = Object.keys(fields);
      const payload = {};
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        let value = fields[key];
        if (value !== undefined)
          payload[key] = value;
      }

      payload.tenantId = tenantProfile._id;
      
      payloads.push(payload);
    }

    if (!payloads.length)
      return [];

    const savedModels = await this._schema.create(payloads);
    return [...savedModels.map(m => m.toObject())];
  }


  async updateOne(searchQuery, fields) {
    const scopeQuery = await this.getBaseScopeQuery();
    const model = await this._schema.findOne({ ...searchQuery, ...scopeQuery });

    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = fields[key];
      if (value !== undefined)
        model[key] = value;
    }

    const tenantProfile = await this.getTenantInstance();
    model.tenantId = tenantProfile._id;

    const updatedModel = await model.save();
    return updatedModel.toObject();
  }


  async updateMany(searchQuery, updateQuery, options = {}) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await this._schema.update({ ...searchQuery, ...scopeQuery }, updateQuery, { ...options, multi: true });
    return result;
  }

  
  async deleteOne(searchQuery) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await this._schema.deleteOne({ ...searchQuery, ...scopeQuery });
    return result;
  }

}


export default BaseService;