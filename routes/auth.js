import auth from '../controllers/auth.js'
import koa_router from 'koa-router'
const router = koa_router()

router.post('/sign-in', auth.signIn)
router.post('/sign-up', auth.signUp)
router.get('/verification-token', auth.getVerificationToken)
router.post('/verification-token', auth.createVerificationToken)

export default router