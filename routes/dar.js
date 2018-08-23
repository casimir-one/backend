import dar from './../controllers/dar'
import koa_router from 'koa-router'
import config from './../config';

const router = koa_router()

router.get('/list', dar.listDarArchives)
router.get('/:dar', dar.readDarArchive)
router.get('/:dar/assets/:file', dar.readDarArchiveStaticFiles)
router.get('/drafts/:researchId', dar.listDarDrafts)
router.get('/drafts/hash/:draftId', dar.calculateHash)
router.get('/drafts/meta/:hashOrId', dar.getDarDraftMeta)

router.put('/:dar', dar.updateDarArchive)
router.post('/drafts/create/:researchId', dar.createDarArchive)
router.post('/drafts/propose/:draftId', dar.createDarProposal)
router.delete('/drafts/:draftId', dar.deleteDarDraft)
router.put('/drafts/unlock/:draftId', dar.unlockDarDraft)

export default router