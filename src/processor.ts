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
        console.log('xyk.PoolCreated event handler called');
    }
);

processor.addEventHandler(
    'balances.Transfer',
    async (ctx: EventHandlerContext) => {
        console.log('balances.Transfer event handler called');
    }
);

processor.addEventHandler(
    'tokens.Transfer',
    async (ctx: EventHandlerContext) => {
        console.log('tokens.Transfer event handler called');
    }
);

processor.run();
