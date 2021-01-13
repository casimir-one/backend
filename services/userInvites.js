import deipRpc from '@deip/rpc-client';
import config from './../config';
import BaseReadModelService from './base';
import UserInvite from './../schemas/userInvite';
import ResearchService from './../services/research';
import { USER_INVITE_STATUS } from './../constants';


class UserInviteService extends BaseReadModelService {

  constructor() { super(UserInvite); }

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
      status: status ? status : status,
      failReason: failReason ? failReason : failReason
    });

    return result;
  }
}

export default UserInviteService;