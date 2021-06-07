import BaseService from './../../base/BaseService';
import UserSchema from './../../../schemas/UserSchema';
import { USER_PROFILE_STATUS } from '../../../constants';
import config from './../../../config';

class UserService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(UserSchema, options);
  }

  async createUser({
    username,
    tenant,
    signUpPubKey,
    status,
    email,
    attributes,
    roles
  }) {

    const result = await this.createOne({
      _id: username,
      signUpPubKey: signUpPubKey,
      status: status,
      email: email,
      attributes: attributes,
      tenant: tenant,
      roles: roles
    });

    return result;
  }

  async updateUser(username, {
    status,
    email,
    attributes,
  }) {

    const result = await this.updateOne({ _id: username }, {
      status,
      email,
      attributes
    });

    return result;
  }

  async deleteUser(username) {
    const result = await this.deleteOne({ _id: username })
    return result;
  }

  async getUser(username) {
    const profile = await this.findOne({ _id: username, status: USER_PROFILE_STATUS.APPROVED });
    return profile;
  }

  hasRole(user, role, tenantId = config.TENANT) {
    return user.profile.roles
      .some((userRole) => tenantId == userRole.researchGroupExternalId && role == userRole.role);
  }
}

export default UserService;