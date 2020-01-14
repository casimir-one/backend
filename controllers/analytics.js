import { mailchimpEvents, mailchimpEventsValues } from '../common/enums';
import mailchimpService from '../services/mailchimp';

const trackMailchimpEvent = async function (ctx) {
  const { event, trackingEmail } = ctx.request.body;

  try {
    if (!mailchimpEventsValues.includes(event)) {
      ctx.status = 400;
      ctx.body = 'Unsupported event';
      return;
    }
    await mailchimpService.createCustomEventForMemberByEmail(trackingEmail, event);
    ctx.status = 204;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

export default {
  trackMailchimpEvent
}