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

processor.addEventHandler(
    'balances.Transfer',
    async (ctx: EventHandlerContext) => {
        const transfer = getTransferFromBalancesEvent(ctx);
        const tip = ctx.extrinsic?.tip || 0n;
        await updatePoolBalance(ctx.store, transfer, tip);

        console.log('balance transfer of ' + transfer.amount + ' BSX');
    }
);

processor.addEventHandler(
    'tokens.Transfer',
    async (ctx: EventHandlerContext) => {
        const transfer = getTransferFromTokensEvent(ctx);
        const tip = 0n;
        await updatePoolBalance(ctx.store, transfer, tip);

        console.log(
            'token transfer of ' +
                transfer.amount +
                ' assetId: ' +
                transfer.asset
        );
    }
);

processor.addPostHook(async (ctx: BlockHandlerContext) => {
    const blockHeight = BigInt(ctx.block.height);
    const createdAt = new Date(ctx.block.timestamp);

    // fetch all pools
    const pools = await ctx.store.find<Pool>(Pool);

    const databaseQueries = pools.map(async (pool: Pool) => {
        const historicalBalance = await getOrCreate(
            ctx.store,
            HistoricalBalance,
            `${pool.id}-${blockHeight}`,
            {
                assetABalance: pool.assetABalance,
                assetBBalance: pool.assetBBalance,
                pool,
                blockHeight,
                createdAt,
            }
        );
        return ctx.store.save(historicalBalance);
    });
    await Promise.all(databaseQueries);
});

const updatePoolBalance = async (
    store: Store,
    transfer: TransferEventParameters,
    tip: bigint
) => {
    // get returns entity or undefined
    const poolIsSender = await get(store, Pool, transfer.from);
    const poolIsReceiver = await get(store, Pool, transfer.to);

    if (poolIsSender) {
        // decrease balance
        let pool = poolIsSender;
        pool = decreaseBalance(transfer, pool, tip);
        await store.save(pool);
    } else if (poolIsReceiver) {
        // increase balance
        let pool = poolIsReceiver;
        pool = increaseBalance(transfer, pool, tip);
        await store.save(pool);
    } else {
        // skip because account is not an xyk pool
        return;
    }
};

processor.run();

interface TransferEventParameters {
    from: string;
    to: string;
    amount: bigint;
    asset: bigint;
}

function increaseBalance(
    transfer: TransferEventParameters,
    pool: Pool,
    tip: bigint
): Pool {
    if (transfer.asset === pool.assetA) {
        pool.assetABalance = pool.assetABalance || 0n;
        pool.assetABalance += transfer.amount;
        if (transfer.asset === 0n) pool.assetABalance += tip;
    }
    if (transfer.asset === pool.assetB) {
        pool.assetBBalance = pool.assetBBalance || 0n;
        pool.assetBBalance += transfer.amount;
        if (transfer.asset === 0n) pool.assetBBalance += tip;
    }
    return pool;
}

function decreaseBalance(
    transfer: TransferEventParameters,
    pool: Pool,
    tip: bigint
): Pool {
    if (transfer.asset === pool.assetA) {
        pool.assetABalance = pool.assetABalance || 0n;
        pool.assetABalance -= transfer.amount;
        if (transfer.asset === 0n) pool.assetABalance -= tip;
    }
    if (transfer.asset === pool.assetB) {
        pool.assetBBalance = pool.assetBBalance || 0n;
        pool.assetBBalance -= transfer.amount;
        if (transfer.asset === 0n) pool.assetBBalance -= tip;
    }
    return pool;
}

function getTransferFromBalancesEvent(
    ctx: EventHandlerContext
): TransferEventParameters {
    const event = new BalancesTransferEvent(ctx);

    return {
        from: ss58.codec('basilisk').encode(event.asLatest.from),
        to: ss58.codec('basilisk').encode(event.asLatest.to),
        amount: event.asLatest.amount,
        asset: BigInt(0),
    };
}

function getTransferFromTokensEvent(
    ctx: EventHandlerContext
): TransferEventParameters {
    const event = new TokensTransferEvent(ctx);

    return {
        from: ss58.codec('basilisk').encode(event.asLatest.from),
        to: ss58.codec('basilisk').encode(event.asLatest.to),
        amount: event.asLatest.amount,
        asset: BigInt(event.asLatest.currencyId),
    };
}
