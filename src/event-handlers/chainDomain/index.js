import blockEventHandler from './impl/BlockEventHandler';
import daoEventHandler from './impl/DaoEventHandler';
import ftEventHandler from './impl/FTEventHandler';
import nativeFTEventHandler from './impl/NativeFTEventHandler';
import nftEventHandler from './impl/NFTEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';


module.exports = {
    ftEventHandler,
    blockEventHandler,
    daoEventHandler,
    proposalEventHandler,
    nativeFTEventHandler,
    nftEventHandler,
}