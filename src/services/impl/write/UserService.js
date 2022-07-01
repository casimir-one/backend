import config from './../../../config';
import UserSchema from './../../../schemas/UserSchema';
import BaseService from './../../base/BaseService';

class UserService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async createUser({
    username,
    portal,
    signUpPubKey,
    status,
    email,
    teams,
    attributes,
    roles,
    address
  }) {

    const result = await this.createOne({
      _id: username,
      signUpPubKey: signUpPubKey,
      status: status,
      email: email,
      attributes: attributes,
      portal: portal,
      teams: teams,
      roles: roles,
      address
    });

    return result;
  }

  async updateUser(username, {
    status,
    email,
    attributes,
    teams,
    roles
  }) {
    const result = await this.updateOne({ _id: username }, {
      status,
      email,
      attributes,
      teams,
      roles
    });

    return result;
  }

  async deleteUser(username) {
    const result = await this.deleteOne({ _id: username })
    return result;
  }

  async getUser(username, status) {
    const query = { _id: username };
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