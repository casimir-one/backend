import config from './../../../config';
import UserSchema from './../../../schemas/UserSchema';
import BaseService from './../../base/BaseService';

class UserService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async createUser({
    _id: userId,
    pubKey,
    status,
    email,
    attributes,
    roles,
  }) {

    const result = await this.createOne({
      _id: userId,
      pubKey,
      status,
      email,
      attributes,
      roles,
    });

    return result;
  }

  async updateUser(userId, {
    status,
    pubKey,
    email,
    attributes,
  }) {
    const result = await this.updateOne({ _id: userId }, {
      pubKey,
      status,
      email,
      attributes
    });

    return result;
  }

  async deleteUser(userId) {
    const result = await this.deleteOne({ _id: userId })
    return result;
  }

  async getUser(userId, status) {
    const query = { _id: userId };
    if (status) {
      query.status = status;
    }
    const profile = await this.findOne(query);
    return profile;
  }

  async getUserByEmail(email, status) {
    const query = { email };
    if (status) {
      query.status = status;
    }
    const profile = await this.findOne(query);
    if (!profile) return null;
    return profile;
  }

  hasRole(user, role, portalId = config.TENANT) {
    return user.profile.roles
      .some((userRole) => portalId == userRole.teamId && role == userRole.role);
  }
}

export default UserService;