import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import {
  UserBookmarkService
} from './../../services';


class UserSettingsEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userSettingsEventHandler = new UserSettingsEventHandler();
const userBookmarkService = new UserBookmarkService();

userSettingsEventHandler.register(APP_EVENT.BOOKMARK_CREATED, async (event) => {
  const { username, type, ref } = event.getEventPayload();

  await userBookmarkService.createUserBookmark({
    username,
    type,
    ref
  });
});

userSettingsEventHandler.register(APP_EVENT.BOOKMARK_DELETED, async (event) => {
  const { bookmarkId } = event.getEventPayload();

  await userBookmarkService.deleteUserBookmark(bookmarkId);
});

module.exports = userSettingsEventHandler;