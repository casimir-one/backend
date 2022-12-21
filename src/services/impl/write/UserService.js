import UserSchema from './../../../schemas/UserSchema';
import BaseService from './../../base/BaseService';

class UserService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async getUser(userId, status) {
    const query = { _id: userId };
    if (status) {
      query.status = status;
    }
    const user = await this.findOne(query);
    return user;
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

}

export default UserService;