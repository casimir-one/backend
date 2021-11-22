import assert from 'assert';
import config from './../../config';
import PortalSchema from './../../schemas/PortalSchema';


class BaseService {

  _schema = undefined;
  _tenantProfile = undefined;
  _scoped = undefined;

  constructor(schema, options = { scoped: true }) {
    assert(schema != null, "Service read model schema is not defined");
    this._schema = schema;
    this._scoped = options.scoped;
  }


  async getPortalInstance() {
    if (this._tenantProfile === undefined) {
      const tenantProfile = await PortalSchema.findOne({ _id: config.TENANT });
      if (!tenantProfile) {
        throw new Error(`Tenant ${config.TENANT} is not found`);
      }
      this._tenantProfile = tenantProfile.toObject();
    }

    return this._tenantProfile;
  }


  async getBaseScopeQuery() {
    const tenantProfile = await this.getPortalInstance();
    if (!this._scoped) return {};

    if (tenantProfile.network.isGlobalScopeVisible) {
      const tenants = await PortalSchema.find({});
      const tenantProfiles = tenants.map(t => t.toObject());
      return {
        $or: [
          { tenantId: { $in: [...tenantProfiles.map(t => t._id)] } },
          { tenantIdsScope: { $in: [...tenantProfiles.map(t => t._id)] } },
          { isGlobalScope: true }
        ]
      };
    } else if (tenantProfile.network.visibleTenantIds.length) {
      return {
        $or: [
          { tenantId: { $in: [...tenantProfile.network.visibleTenantIds] } },
          { tenantIdsScope: { $in: [...tenantProfile.network.visibleTenantIds] } },
          { isGlobalScope: true }
        ]
      };
    } else {
      return {
        $or: [
          { tenantId: { $in: [tenantProfile._id] } },
          { tenantIdsScope: { $in: [tenantProfile._id] } },
          { isGlobalScope: true }
        ]
      };
    }
  }


  async findOne(searchQuery) {
    const scopeQuery = await this.getBaseScopeQuery();
    const model = await this._schema.findOne({ ...searchQuery, ...scopeQuery });
    const result = model ? model.toObject() : null;
    return result;
  }


  async findMany(searchQuery) {
    const scopeQuery = await this.getBaseScopeQuery();
    const models = await this._schema.find({ ...searchQuery, ...scopeQuery });
    const results = [...models.map(r => r.toObject())];
    return results;
  }


  async createOne(fields) {
    const tenantProfile = await this.getPortalInstance();

    const keys = Object.keys(fields);
    const payload = {};
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      assert(key !== 'isGlobalScope', `Tenant ${tenantProfile._id} is not authorized to set global scope for models`);
      let value = fields[key];
      if (value !== undefined)
        payload[key] = value;
    }

    if (payload.tenantId) {
      assert(payload.tenantId === tenantProfile._id, `${tenantProfile._id} tenant is not authorized to create models for ${payload.tenantId} tenant`);
    } else {
      payload.tenantId = tenantProfile._id;
    }

    const savedModel = await this._schema.create(payload);
    return savedModel.toObject();
  }


  async createMany(objects) {
    const tenantProfile = await this.getPortalInstance();
    
    const payloads = [];
    for (let i = 0; i < objects.length; i++) {
      const fields = objects[i];

      const keys = Object.keys(fields);
      const payload = {};
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        assert(key !== 'isGlobalScope', `Tenant ${tenantProfile._id} is not authorized to set global scope for models`);
        let value = fields[key];
        if (value !== undefined)
          payload[key] = value;
      }

      if (payload.tenantId) {
        assert(payload.tenantId === tenantProfile._id, `${tenantProfile._id} tenant is not authorized to create models for ${payload.tenantId} tenant`);
      } else {
        payload.tenantId = tenantProfile._id;
      }
      
      payloads.push(payload);
    }

    if (!payloads.length)
      return [];

    const savedModels = await this._schema.create(payloads);
    return [...savedModels.map(m => m.toObject())];
  }


  async updateOne(searchQuery, fields) {
    const tenantProfile = await this.getPortalInstance();
    const scopeQuery = await this.getBaseScopeQuery();

    const model = await this._schema.findOne({ ...searchQuery, ...scopeQuery });
    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      assert(key !== 'isGlobalScope', `Tenant ${tenantProfile._id} is not authorized to set global scope for models`);
      let value = fields[key];
      if (key === 'tenantId') {
        assert(value === tenantProfile._id, `${tenantProfile._id} tenant is not authorized to update models for ${value} tenant`);
      }
      if (value !== undefined)
        model[key] = value;
    }

    const updatedModel = await model.save();
    return updatedModel.toObject();
  }


  async updateMany(searchQuery, updateQuery, options = {}) {
    const tenantProfile = await this.getPortalInstance();

    const scopeQuery = await this.getBaseScopeQuery();
    if (updateQuery.$set && updateQuery.$set) {
      assert(!!!updateQuery.$set.tenantId || updateQuery.$set.tenantId === tenantProfile._id, `${tenantProfile._id} tenant is not authorized to update models for ${updateQuery.$set.tenantId} tenant`);
      assert(!!!updateQuery.$set.isGlobalScope, `Tenant ${tenantProfile._id} is not authorized to set global scope for models`);
    }

    const result = await this._schema.update({ ...searchQuery, ...scopeQuery }, updateQuery, { ...options, multi: true });
    return result;
  }

  
  async deleteOne(searchQuery) {
    const tenantProfile = await this.getPortalInstance();

    const scopeQuery = { tenantId: tenantProfile._id };
    const result = await this._schema.deleteOne({ ...searchQuery, ...scopeQuery });
    return result;
  }

}


export default BaseService;