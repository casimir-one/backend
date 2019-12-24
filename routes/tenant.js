import koa_router from 'koa-router'
import tenant from '../controllers/tenant'

const router = koa_router()

router.get('/logo/:tenant', tenant.getTenantLogo);
router.get('/profile/:tenant', tenant.getTenantProfile);
router.get('/profiles', tenant.getTenantsProfiles);

export default router;