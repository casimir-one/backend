import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import UserNotification from './../schemas/userNotification';


class UserNotificationService extends BaseReadModelService {

  constructor() { super(UserNotification); }

  async createUserNotification({
    username,
    status,
    type,
    metadata
  }) {

    const result = await this.createOne({
      username,
      status,
      type,
      metadata
    });
    return result;
  }


  async createUserNotifications(models) {

    const notifications = models.map(notification => {
      
      const {
        username,
        status,
        type,
        metadata
      } = notification;

      return { username, status, type, metadata };
    })

    const result = await this.createMany(notifications);
    return result;
  }

}

export default UserNotificationService;