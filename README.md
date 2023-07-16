# MOOW Contracts Overview

This document provides the technical details about the smart contract system that powers the TIC and TAC tokens on the Binance Smart Chain. These contracts leverage the [BEP20](BEP-20.md) token standard and provide additional functionalities like upgradability and anti-bot mechanisms. The [canonical-upgradeable-bep20](https://github.com/bnb-chain/canonical-upgradeable-bep20) is used as a reference implementation.

## Contract Overview

The TIC and TAC tokens consists of two primary smart contracts: `BEP20TokenImplementation` and `BEP20UpgradeableProxy`.

### BEP20TokenImplementation

This contract represents the logic of the TIC and TAC tokens. It includes all BEP20 functions such as `balanceOf`, `transfer`, `approve`, `allowance`, etc. The contract also provides additional functionalities like mintability, ownership, burning, and an anti-bot mechanism.

### BEP20UpgradeableProxy

This contract acts as a proxy to the `BEP20TokenImplementation` contract. It delegates all calls to the implementation contract and enables upgradability features. When the `BEP20TokenImplementation` contract needs to be upgraded, a new version of the contract is deployed and the proxy contract's implementation reference is updated to the new contract address.

## Contract Initialization

On deployment, the `initialize` function of the `BEP20UpgradeableProxy` is called with the following parameters:

- `name`: The name of the token (e.g., "TIC").
- `symbol`: The symbol of the token (e.g., "TIC").
- `decimals`: The number of decimal places for the token (e.g., 8).
- `amount`: The initial supply of the token.
- `mintable`: A boolean flag to specify whether new tokens can be minted in the future.
- `owner`: The address of the initial owner of all tokens.
- `start_block`: The block number from which transfers are allowed.

## Testing Overview

The system includes comprehensive test suites that validate the behavior of the token contracts. The test suites cover the following aspects:

- Deployment: Validates the initial state of the token after deployment.
- Transactions: Validates that token transfers and allowances function correctly.
- Minting: Validates the behavior of the minting functionality.
- Ownership: Validates the behavior of the contract ownership functionality.
- Burn: Validates the behavior of the token burning functionality.
- Anti-bot: Validates the behavior of the anti-bot mechanism.

## Anti-bot Mechanism

The anti-bot mechanism helps to prevent non-owner addresses from transferring tokens before a specified start block. If a non-owner address attempts to transfer tokens before the start block, they are added to a blacklist. However, the owner address is allowed to transfer tokens before the start block without being blacklisted.

To achieve this, the `transfer` function is overridden to include an additional check. Before making a transfer, it verifies whether the caller is the owner or if the current block number is greater than or equal to the start block. If neither condition is met, the caller's address is added to the blacklist.

All addresses on the blacklist are disallowed from making any further token transfers.

This mechanism is especially useful in preventing bots from participating in the initial token distribution phase.

## Contract Upgradeability

The system is designed to be upgradeable using a proxy pattern. The `BEP20UpgradeableProxy` contract serves as the entry point to the system. All calls to the token contract are first received by the proxy contract, which then delegates the calls to the `BEP20TokenImplementation` contract. This setup allows the `BEP20TokenImplementation` contract to be replaced with a new contract in the future without affecting the state of the tokens.

When a new version of the `BEP20TokenImplementation` contract is deployed, the address of the new contract is given to the `BEP20UpgradeableProxy` contract through a call to its `upgradeTo` function. From that point onwards, the proxy contract will delegate all calls to the new implementation contract, thereby implementing the upgrade.

This approach ensures that even as the token contract logic evolves and improves over time, token holders will not need to take any action or experience any disruption.

# Tokens

| Name | Symbol | Decimals | Total Supply   | Mintable |
| ---- | ------ | -------- | -------------- | -------- |
| TIC  | TIC    | 8        | unlimited      | Yes      |
| TAC  | TAC    | 8        | 1,000,000,000  | No       |

## Deployment

### Create a `.env` file with the following content:

```bash
TOKEN_NAME=TIC
TOKEN_SYMBOL=TIC
TOKEN_DECIMALS=8
TOKEN_TOTAL_SUPPLY=0
TOKEN_MINTABLE=true
TOKEN_START_BLOCK=0 # see anti-bot mechanism
DEPLOYER_KEY=0x... # private key of the deployer
ADMIN_KEY=0x... # private key of the admin
BSCSCAN_API_KEY=... # for verifying contracts
```

### Install dependencies

```bash
npm install
```

### Deploy contracts

```bash
npm run deploy:testnet
npm run deploy:mainnet
```

### Run tests

```bash
npm test
```

### Run tests with coverage

```bash
npm run test:coverage
```
