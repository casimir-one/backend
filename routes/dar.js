import dar from './../controllers/dar'
import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/list', dar.list)
router.get('/:dar', dar.read)
router.get('/:dar/assets/:file', dar.readStatic)
router.get('/drafts/:researchId', dar.drafts)
router.get('/drafts/hash/:draftId', dar.calculateHash)
router.get('/drafts/meta/:hashOrId', dar.getDraftMeta)

router.put('/:dar', dar.write)
router.post('/create/:researchId', dar.create)
router.delete('/drafts/:draftId', dar.deleteDraft)

export default router