# MOOW Smart Contracts

## Overview
Create a `.env` file with the following content:

```bash
TOKEN_NAME=TIC
TOKEN_SYMBOL=TIC
TOKEN_DECIMALS=8
TOKEN_TOTAL_SUPPLY=0
TOKEN_MINTABLE=true
TOKEN_START_BLOCK=0 # for preventing sniping bots
DEPLOYER_KEY=0x... # private key of the deployer
ADMIN_KEY=0x... # private key of the admin
BSCSCAN_API_KEY=... # for verifying contracts
```

Install dependencies:

```bash
npm install
```

Deploy contracts:

```bash
npm run deploy:testnet
npm run deploy:mainnet
```

Run tests:

```bash
npm test
```
