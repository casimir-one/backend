import { ProtocolChain, USER_PROFILE_STATUS } from '@casimir/platform-core';
import BaseService from '../../base/BaseService';
import UserSchema from './../../../schemas/UserSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import { genRipemd160Hash } from '@deip/toolbox';
import TeamService from '../write/TeamService';


const teamService = new TeamService()

class UserDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserSchema, options);
  }

  async mapUsers(users) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    // temp for substrate migration
    const isValidChainId = (value) => { 
      return config.PROTOCOL === ProtocolChain.GRAPHENE || (value.length === 40 && /^[0-9a-fA-F]+$/.test(value));
    };
    const chainAccounts = await chainRpc.getAccountsAsync(users.map(user => isValidChainId(user._id) ? user._id : genRipemd160Hash(user.email)));
    const portalProfile = await this.getPortalInstance();
    const chainBalances = await Promise.all(users.map((user) => chainRpc.getFungibleTokenBalancesByOwnerAsync(user._id)));

    return users.map((user) => {

      const chainAccount = chainAccounts.find((chainAccount) => chainAccount && chainAccount.daoId == user._id);

      const balances = [];
      let pubKey;

      if (chainAccount) {

        const userBalances = chainBalances.flat().filter((chainBalance) => chainBalances && chainBalance.account === chainAccount.daoId);
        balances.push(...userBalances);

        pubKey = chainAccount.authority.owner.auths
          .filter((auth) => !!auth.pubKey)
          .map((auth) => auth.pubKey)[0];

      } else {
        console.warn(`User account with ID '${user._id}' is not found in the Chain`);
      }

      const appModules = portalProfile.settings.modules;
      const roleInfo = portalProfile.settings.roles.find((appRole) => user.roles.some((userRole) => appRole.role == userRole.role));
      const roles = user.roles.map(r => ({
        role: r.role,
        teamId: r.teamId
      }));
      const modules = roleInfo && roleInfo.modules ? roleInfo.modules : appModules;

      return {
        _id: user._id,
        portalId: user.portalId,
        email: user.email,
        attributes: user.attributes,
        balances: balances,
        modules: modules,
        roles: roles,
        pubKey: pubKey || null,
        signUpPubKey: user.signUpPubKey || null,
        status: user.status,
        teams: user.teams,
        createdAt: user.createdAt || user.created_at,
        updatedAt: user.updatedAt || user.updated_at,
        metadataHash: chainAccount ? chainAccount.metadata : null,


        // @deprecated
        username: user._id,
        entityId: user._id,
        account: chainAccount ? { ...chainAccount, balances } : { balances },
        profile: {
          ...user,
          modules,
          roles
        },
        created: user.createdAt
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
    const [result] = await this.mapUsers([user]);
    return result;
  }


  async getUser(username, status) {
    const query = { _id: username };
    if (status) {
      query.status = status;
    }
    const user = await this.findOne(query);
    if (!user) return null;
    const [result] = await this.mapUsers([user]);
    return result;
  }


  async getUsers(usernames) {
    const users = await this.findMany({ _id: { $in: [...usernames] }, status: USER_PROFILE_STATUS.APPROVED });
    if (!users.length) return [];
    const result = await this.mapUsers(users);
    return result;
  }


  // TODO: Remove this
  async findUserProfileByOwner(username) {
    const user = await this.findOne({ _id: username });
    return user;
  }


  async findUserProfilesByStatus(status) {
    const users = await this.findMany({ status: status })
    return users;
  }


  async findUserProfiles(accounts) {
    const users = await this.findMany({ '_id': { $in: accounts } });
    return users;
  }


  async getUsersByTeam(teamId) {
    const team = await teamService.getTeam(teamId);
    if (!team) return [];
    const { members } = team;
    const users = await this.findMany({ _id: { $in: [...members] }, status: USER_PROFILE_STATUS.APPROVED });
    if (!users.length) return [];
    const result = await this.mapUsers(users);
    return result;
  }


  async getUsersByPortal(portalId) {
    const available = await this.findMany({ status: USER_PROFILE_STATUS.APPROVED });
    const users = available.filter(p => p.portalId == portalId);
    if (!users.length) return [];
    const result = await this.mapUsers(users);
    return result;
  }

  
  async getUsersListing(status) {
    const users = await this.findMany({ status: status ? status : USER_PROFILE_STATUS.APPROVED });
    if (!users.length) return [];
    const result = await this.mapUsers(users);
    return result;
  }
}

export default UserDtoService;