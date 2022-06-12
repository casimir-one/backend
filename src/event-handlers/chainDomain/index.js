import fungibleTokenEventHandler from './impl/FungibleTokenEventHandler';
import blockEventHandler from './impl/BlockEventHandler';
import daoEventHandler from './impl/DaoEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import nativeFungibleTokenEventHandler from './impl/NativeFungibleTokenEventHandler';
import nonFungibleTokenEventHandler from './impl/NonFungibleTokenEventHandler';


module.exports = {
    fungibleTokenEventHandler,
    blockEventHandler,
    daoEventHandler,
    proposalEventHandler,
    nativeFungibleTokenEventHandler,
    nonFungibleTokenEventHandler,
}