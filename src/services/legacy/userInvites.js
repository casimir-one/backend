import BaseService from './../base/BaseService';
import UserInviteSchema from './../../schemas/UserInviteSchema';
import ResearchService from './../../services/impl/read/ProjectDtoService';
import { USER_INVITE_STATUS } from './../../constants';


class UserInviteService extends BaseService {

  constructor(options = { scoped: true }) {
    super(UserInviteSchema, options);
  }

  async findUserInvite(externalId) {
    const result = await this.findOne({ _id: externalId });
    return result;
  }


  async findUserPendingInvites(username) {
    const result = await this.findMany({ invitee: username, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date() } });
    return result;
  }


  async findResearchGroupPendingInvites(researchGroupExternalId) {
    const result = await this.findMany({ researchGroupExternalId: researchGroupExternalId, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date() } });
    return result;
  }


  async findResearchPendingInvites(researchExternalId) {
    const researchService = new ResearchService();

    const research = await researchService.getResearch(researchExternalId);
    const researchGroupExternalId = research.research_group.external_id;

    const result = await this.findMany({
      researchGroupExternalId: researchGroupExternalId,
      status: USER_INVITE_STATUS.SENT,
      $or: [
        { 'researches': { $exists: false } },
        { 'researches': null },
        { 'researches.externalId': { $in: [researchExternalId] } }
      ],
      expiration: { $gt: new Date() }
    });

    return result;
  }


  async createUserInvite({
    externalId,
    invitee,
    creator,
    researchGroupExternalId,
    rewardShare,
    status,
    notes,
    researches,
    expiration
  }) {

    const result = await this.createOne({
      _id: externalId,
      invitee,
      creator,
      researchGroupExternalId,
      rewardShare,
      status,
      notes,
      expiration,
      researches,
      failReason: null
    });

    return result;
  }


  async updateUserInvite(externalId, {
    status,
    failReason,
  }) {

    const result = await this.updateOne({ _id: externalId }, {
      status,
      failReason
    });

    return result;
  }
}

export default UserInviteService;