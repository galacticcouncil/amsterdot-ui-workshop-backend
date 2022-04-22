import * as ss58 from '@subsquid/ss58';
import {
    BlockHandlerContext,
    EventHandlerContext,
    Store,
    SubstrateProcessor,
} from '@subsquid/substrate-processor';
import { get, getOrCreate } from './getOrCreate';
import { HistoricalBalance, Pool } from './model';
import {
    BalancesTransferEvent,
    TokensTransferEvent,
    XykPoolCreatedEvent,
} from './types/events';

const processor = new SubstrateProcessor('amsterDOT-workshop');

processor.setBatchSize(500);
processor.setDataSource({
    archive: 'https://amsterdot-archive.eu.ngrok.io/v1/graphql',
    chain: 'wss://amsterdot.eu.ngrok.io',
});

processor.addEventHandler(
    'xyk.PoolCreated',
    async (ctx: EventHandlerContext) => {
        const xykCreatedEvent = new XykPoolCreatedEvent(ctx);
        const xykPoolId = ss58
            .codec('basilisk')
            .encode(xykCreatedEvent.asLatest[5]);

        const pool = await getOrCreate(ctx.store, Pool, xykPoolId);
        pool.assetA = BigInt(xykCreatedEvent.asLatest[1]);
        pool.assetB = BigInt(xykCreatedEvent.asLatest[2]);
        pool.assetABalance = BigInt(0);
        pool.assetBBalance = BigInt(0);
        await ctx.store.save(pool);

        console.log('new xyk pool saved with id:', xykPoolId);
    }
);

processor.run();
