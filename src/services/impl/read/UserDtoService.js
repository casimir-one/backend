import { USER_PROFILE_STATUS } from '@casimir.one/platform-core';
import BaseService from '../../base/BaseService';
import UserSchema from './../../../schemas/UserSchema';
import TeamService from '../write/TeamService';


class UserDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async mapDTOs(users) {
    return users.map((user) => {
      const roles = user.roles.map(r => ({
        role: r.role,
        teamId: r.teamId
      }));

      return {
        _id: user._id,
        portalId: user.portalId,
        pubKey: user.pubKey,
        email: user.email,
        attributes: user.attributes,
        roles: roles,
        status: user.status,
        teams: user.teams,
        createdAt: user.createdAt || user.created_at,
        updatedAt: user.updatedAt || user.updated_at
      };
    });
  }


  async getUserByEmail(email, status) {
    const query = { email };
    if (status) {
      query.status = status;
    }
    const user = await this.findOne(query);
    if (!user) return null;
    const [result] = await this.mapDTOs([user]);
    return result;
  }


  async getUser(_id, status) {
    const query = { _id: _id };
    if (status) {
      query.status = status;
    }
    const user = await this.findOne(query);
    if (!user) return null;
    const [result] = await this.mapDTOs([user]);
    return result;
  }


  async getUsersPaginated(filter, sort, pagination) {
    const f = filter || {};
    const { paginationMeta, result: nftItems } = await this.findManyPaginated(f, sort, pagination);
    const result = await this.mapDTOs(nftItems);
    return { paginationMeta, result };
  }

}

export default UserDtoService;