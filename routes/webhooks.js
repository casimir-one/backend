import pricing from '../controllers/pricing'
import koa_router from 'koa-router'

const router = koa_router()

router.post('/customer/subscription/updated', pricing.customerSubscriptionUpdatedWebhook);

export default router;

