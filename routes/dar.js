import dar from './../controllers/dar'
import koa_router from 'koa-router'
import config from './../config';

import jwt from 'koa-jwt';

const router = koa_router()

router.get('/list', dar.list)
router.get('/:dar', dar.read)
router.get('/:dar/assets/:file', dar.readStatic)

router.put('/:dar', dar.write)
router.put('/:dar/clone/:newdar', dar.clone)

export default router