import { APP_EVENT } from '@deip/constants';
import { LayoutService } from '../../../services';
import BaseEventHandler from '../../base/BaseEventHandler';

class LayoutEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const layoutEventHandler = new LayoutEventHandler();
const layoutService = new LayoutService();

layoutEventHandler.register(APP_EVENT.LAYOUT_CREATED, async (event) => {
  const layout = event.getEventPayload();

  const newLayout = await layoutService.createLayout(layout);
});

layoutEventHandler.register(APP_EVENT.LAYOUT_UPDATED, async (event) => {
  const layout = event.getEventPayload();

  const updatedLayout = await layoutService.updateLayout(layout);
});

layoutEventHandler.register(APP_EVENT.LAYOUT_DELETED, async (event) => {
  const { layoutId } = event.getEventPayload();

  const deletedLayout = await layoutService.deleteLayout(layoutId);
});

module.exports = layoutEventHandler;