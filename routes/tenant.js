import koa_router from 'koa-router'
import tenant from '../controllers/tenant'
import auth from '../controllers/auth'

const router = koa_router()

router.get('/logo', tenant.getTenantLogo);
router.get('/profile', tenant.getTenantProfile);
router.get('/sign-ups', tenant.getSignUpRequests);
router.put('/sign-ups/approve', tenant.approveSignUpRequest);
router.put('/sign-ups/reject', tenant.rejectSignUpRequest);
router.post('/sign-up', auth.signUp);


export default router;