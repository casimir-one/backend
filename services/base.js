import deipRpc from '@deip/rpc-client';
import mongoose from 'mongoose';
import assert from 'assert';
import config from './../config';
import TenantProfile from './../schemas/tenant';

class BaseReadModelService {

  _schema = undefined;
  _tenant = undefined;

  constructor(schema) {
    assert(schema != null, "Service read model schema is not defined");
    this._schema = schema;
  }


  async getTenantInstance() {
    if (this._tenant === undefined) {
      const tenant = await TenantProfile.findOne({ _id: config.TENANT });
      if (!tenant) {
        throw new Error(`Tenant ${config.TENANT} is not found`);
      }
      this._tenant = tenant.toObject();
    }

    return this._tenant;
  }


  async getBaseScopeQuery() {
    const tenant = await this.getTenantInstance();

    if (tenant.network.scope.length) {
      const isAll = tenant.network.scope.some(s => s == 'all'); 
      if (isAll) { // temp solution until access management implementation
        const tenants = await TenantProfile.find({});
        return { tenantId: { $in: [...tenants.map(t => t._id.toString())] } };
      } else {
        return { tenantId: { $in: [...tenant.network.scope] } };
      }
    } else {
      return { tenantId: { $in: [tenant._id] } };
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

    const tenant = await this.getTenantInstance();
    payload.tenantId = tenant._id;

    const savedModel = await this._schema.create(payload);
    return savedModel.toObject();
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

    const tenant = await this.getTenantInstance();
    model.tenantId = tenant._id;

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


export default BaseReadModelService;