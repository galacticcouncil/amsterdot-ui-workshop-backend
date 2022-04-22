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
        // get returns entity or undefined
        const poolIsSender = await get(ctx.store, Pool, transfer.from);
        const poolIsReceiver = await get(ctx.store, Pool, transfer.to);

        if (poolIsSender) {
            // decrease balance
            let pool = poolIsSender;
            pool = decreaseBalance(transfer, pool, tip);
            await ctx.store.save(pool);
        } else if (poolIsReceiver) {
            // increase balance
            let pool = poolIsReceiver;
            pool = increaseBalance(transfer, pool, tip);
            await ctx.store.save(pool);
        } else {
            // skip because account is not an xyk pool
            return;
        }

        console.log('balance transfer of ' + transfer.amount + ' BSX');
    }
);

processor.run();

interface TransferEventParameters {
    from: string;
    to: string;
    amount: bigint;
    asset: bigint;
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

function increaseBalance(
    transfer: TransferEventParameters,
    pool: Pool,
    tip: bigint
): Pool {
    if (transfer.asset === pool.assetA) {
        pool.assetABalance = pool.assetABalance || 0n;
        pool.assetABalance += transfer.amount;
        pool.assetABalance += tip;
    }
    if (transfer.asset === pool.assetB) {
        pool.assetBBalance = pool.assetBBalance || 0n;
        pool.assetBBalance += transfer.amount;
        pool.assetBBalance += tip;
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
        pool.assetABalance -= tip;
    }
    if (transfer.asset === pool.assetB) {
        pool.assetBBalance = pool.assetBBalance || 0n;
        pool.assetBBalance -= transfer.amount;
        pool.assetBBalance -= tip;
    }
    return pool;
}
