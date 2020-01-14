import analytics from '../controllers/analytics'
import users from '../controllers/users'
import invites from '../controllers/invites'
import koa_router from 'koa-router'

const router = koa_router()

router.get('/files/avatars/:picture', users.getAvatar)

router.get('/invites/:code', invites.claimInvite)

router.post('/analytics/mailchimp/track-event', analytics.trackMailchimpEvent)

export default router