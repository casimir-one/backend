import BaseService from './base/BaseService';
import UserNotificationDtoSchema from './../schemas/read/UserNotificationDtoSchema';


class UserNotificationService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(UserNotificationDtoSchema, options);
  }

  async getUserNotification(id) {
    const result = await this.findOne({ _id: id });
    return result;
  }

  async getUserNotifications(username, status) {
    const q = { username };
    if (status) {
      q.status = status;
    }
    const result = await this.findMany(q);
    result.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    return result;
  }

  async updateUserNotification(id, {
    status
  }) {
    const result = await this.updateOne({ _id: id }, {
      status
    });
    return result;
  }

  async updateUserNotifications(username, {
    status
  }) {

    const result = await this.updateMany(
      { username },
      { $set: { 'status': status } }
    );

    return result;
  }

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