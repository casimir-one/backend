import pricing from '../controllers/pricing'
import koa_router from 'koa-router'

const router = koa_router()

router.post('/customer/subscription/created', pricing.customerSubscriptionCreatedWebhook);
router.post('/customer/subscription/updated', pricing.customerSubscriptionUpdatedWebhook);
router.post('/customer/payment-intent/succeeded', pricing.customerPaymentIntentSucceededWebhook);

export default router;

