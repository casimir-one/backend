import files from '../controllers/files'
import koa_router from 'koa-router'


const router = koa_router()

router.get('/files/:researchId/:hash', files.getContent)

export default router