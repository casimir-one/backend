import assert from 'assert';
import { isArray, isObject } from '@casimir.one/toolbox';
import config from './../../config';
import PortalSchema from './../../schemas/PortalSchema';


class BaseService {

  _schema = undefined;
  _portalProfile = undefined;
  _scoped = undefined;

  constructor(schema, options = { scoped: true }) {
    assert(schema != null, "Service read model schema is not defined");
    this._schema = schema;
    this._scoped = options.scoped;
  }


  async getPortalInstance() {
    if (this._portalProfile === undefined) {
      const portalProfile = await PortalSchema.findOne({ _id: config.TENANT });
      if (!portalProfile) {
        throw new Error(`Portal ${config.TENANT} is not found`);
      }
      this._portalProfile = portalProfile.toObject();
    }

    return this._portalProfile;
  }


  async getBaseScopeQuery() {
    const portalProfile = await this.getPortalInstance();
    if (!this._scoped) return {};
    return {
      $or: [
        { portalId: { $in: [portalProfile._id] } },
        { portalIdsScope: { $in: [portalProfile._id] } },
        { isGlobalScope: true }
      ]
    };
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

  async getMatchStage(searchQuery = {}) {
    const scopeQuery = await this.getBaseScopeQuery();

    const isNestedObj = (value) => value && isObject(value);
    const parseValue = (value) => {
      //bool
      if (value === "true") return true;
      if (value === "false") return false;
      //number max 16 symbols
      if (value.match(/^\d{0,16}$/) && !isNaN(+value)) return +value;
      //date
      if (!isNaN(new Date(value).valueOf())) return new Date(value);
      //string
      return value;
    }
    const parseValues = (value) => {
      return isArray(value) ? value.map(parseValue) : parseValue(value);
    };

    const matchKey = (key) => {
      const mongoOperatorRegex = /\$[a-z]*/;
      if (!key.match(mongoOperatorRegex)) return null;

      const arrayOperators = ['$in', '$nin'];
      const allowedOperators = [...arrayOperators, '$gt', '$lt', '$exists'];
      if (!allowedOperators.includes(key)) throw new Error(`Match operator ${key} is not allowed`);
    }

    const processQueryObj = (input, deep = 0) => {
      const result = {};
      if (deep > 2) throw new Error("Match is too deep");
      for (let [key, value] of Object.entries(input)) {
        matchKey(key);
        const isNested = isNestedObj(value);
        if (!isNested) {
          const updatedValue = parseValues(value);
          result[key] = updatedValue;
        }
        else
          result[key] = processQueryObj(value, deep + 1);
      }
      return result;
    }

    const match = processQueryObj(searchQuery);
    return { $match: { ...match, ...scopeQuery } };
  }

  getSortStage(sortParams) {
    if (!sortParams) return null;
    const sort = Object.entries(sortParams).reduce((acc, [key, value]) => {
      const sortDirection = value === 'asc' ? 1 : value === 'desc' ? -1 : null;
      if (!sortDirection) throw new Error(`Sort param ${key} must be 'asc' or 'desc'`)
      return { ...acc, [key]: sortDirection };
    }, {})
    return { $sort: sort };
  }

  getPaginationStage(paginationParams) {
    const page = +paginationParams.page || 0;
    const pageSize = +paginationParams.pageSize || 10;

    assert(page > -1, "Pagination param 'page' must be 0 or above");
    assert(pageSize > 0 && pageSize < 100, "Pagination param 'pageSize' must be from 1 to 100");

    const stage = {
      $facet: {
        paginationInfo: [
          { $count: "totalItems" },
        ],
        data: [
          { $skip: page * pageSize },
          { $limit: pageSize }
        ],
      }
    };
    return { stage, extraInfo: { page, pageSize } };
  }

  async findManyPaginated(searchQuery, sortParams, paginationParams) {
    const matchStage = await this.getMatchStage(searchQuery);
    const sortStage = this.getSortStage(sortParams);
    const pagination = this.getPaginationStage(paginationParams);

    const pipeline = [matchStage, sortStage, pagination.stage].filter(Boolean);

    const { extraInfo: { page, pageSize } } = pagination;

    const aggregationResult = await this._schema.aggregate(pipeline)
      .then(x => x[0])

    const data = aggregationResult.data;
    const totalItems = aggregationResult.paginationInfo[0]?.totalItems;
    const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 0;
    const paginationMeta = { page, totalItems, totalPages };

    return { paginationMeta, result: data };
  }


  async createOne(fields) {
    const portalProfile = await this.getPortalInstance();

    const keys = Object.keys(fields);
    const payload = {};
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      assert(key !== 'isGlobalScope', `Portal ${portalProfile._id} is not authorized to set global scope for models`);
      let value = fields[key];
      if (value !== undefined)
        payload[key] = value;
    }

    if (payload.portalId) {
      assert(payload.portalId === portalProfile._id, `${portalProfile._id} portal is not authorized to create models for ${payload.portalId} portal`);
    } else {
      payload.portalId = portalProfile._id;
    }

    const savedModel = await this._schema.create(payload);
    return savedModel.toObject();
  }


  async createMany(objects) {
    const portalProfile = await this.getPortalInstance();

    const payloads = [];
    for (let i = 0; i < objects.length; i++) {
      const fields = objects[i];

      const keys = Object.keys(fields);
      const payload = {};
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        assert(key !== 'isGlobalScope', `Portal ${portalProfile._id} is not authorized to set global scope for models`);
        let value = fields[key];
        if (value !== undefined)
          payload[key] = value;
      }

      if (payload.portalId) {
        assert(payload.portalId === portalProfile._id, `${portalProfile._id} portal is not authorized to create models for ${payload.portalId} portal`);
      } else {
        payload.portalId = portalProfile._id;
      }

      payloads.push(payload);
    }

    if (!payloads.length)
      return [];

    const savedModels = await this._schema.create(payloads);
    return [...savedModels.map(m => m.toObject())];
  }


  async updateOne(searchQuery, fields) {
    const portalProfile = await this.getPortalInstance();
    const scopeQuery = await this.getBaseScopeQuery();

    const model = await this._schema.findOne({ ...searchQuery, ...scopeQuery });
    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      assert(key !== 'isGlobalScope', `Portal ${portalProfile._id} is not authorized to set global scope for models`);
      let value = fields[key];
      if (key === 'portalId') {
        assert(value === portalProfile._id, `${portalProfile._id} portal is not authorized to update models for ${value} portal`);
      }
      if (value !== undefined)
        model[key] = value;
    }

    const updatedModel = await model.save();
    return updatedModel.toObject();
  }


  async updateMany(searchQuery, updateQuery, options = {}) {
    const portalProfile = await this.getPortalInstance();

    const scopeQuery = await this.getBaseScopeQuery();
    if (updateQuery.$set && updateQuery.$set) {
      assert(!!!updateQuery.$set.portalId || updateQuery.$set.portalId === portalProfile._id, `${portalProfile._id} portal is not authorized to update models for ${updateQuery.$set.portalId} portal`);
      assert(!!!updateQuery.$set.isGlobalScope, `Portal ${portalProfile._id} is not authorized to set global scope for models`);
    }

    const result = await this._schema.update({ ...searchQuery, ...scopeQuery }, updateQuery, { ...options, multi: true });
    return result;
  }


  async deleteOne(searchQuery) {
    const portalProfile = await this.getPortalInstance();

    const scopeQuery = { portalId: portalProfile._id };
    const result = await this._schema.deleteOne({ ...searchQuery, ...scopeQuery });
    return result;
  }

}


export default BaseService;
