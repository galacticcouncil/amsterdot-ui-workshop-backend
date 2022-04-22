# AmsterDOT UI workshop

This project is based on the [starter template](https://github.com/subsquid/squid-template) of the [Squid](https://subsquid.io) project. This implementation accumulates Basilisk XYK Pool account balances and serves them via GraphQL API. This API is consumed in the [main UI project](https://github.com/galacticcouncil/amsterdot-ui-workshop) of the workshop. Relevant slides for start [here](https://hackmd.io/OFjHBFqWR6yyLgSmZ7HaQg?both#5-Historical-data).

## Prerequisites

* node 16.x
* docker

## Quickly running the sample

```bash
# 1. Install dependencies
yarn

# 2. Start processor's Postgres database
yarn run processor:db

# 3. Apply database migrations from db/migrations and compile project with script
yarn run processor:reset

# 4. Start the processor
yarn run processor:start

# 5. In another window start GraphQL server
yarn run query-node:start
```

# Bounties

The UI workshop is highly relevant for the [arbitrage bot](https://github.com/galacticcouncil/amsterdot-bounties-2022/issues/4) bounty.