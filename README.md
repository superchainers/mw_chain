# MOOW Smart Contracts

## Overview

The MOOW smart contracts leverage the idea of upgradeable contracts to keep the system flexible and open to improvements. In this architecture, a proxy contract is used to delegate all calls to an implementation contract. When there's a need to upgrade the system, the address of the implementation contract can be updated to point to a new version.

The BEP20 upgradeable proxy in MOOW's context refers to the contract that follows the BEP20 interface and can be upgraded over time. BEP20 is a standard for creating tokens on the Binance Smart Chain. 

The [canonical-upgradeable-bep20](https://github.com/bnb-chain/canonical-upgradeable-bep20) is used in this scenario. It's an upgradeable BEP20 token implementation that can be used as a base contract for more complex token systems.

Upgrades are done through a special admin account, which is the only account that can change the address of the implementation contract. This process must be executed very carefully to ensure that the state of the contract remains consistent and users' balances are not affected. Furthermore, to enhance the security of the upgrade process, it is common to use a multi-signature wallet or a governance system where multiple parties must agree to an upgrade.

Using Hardhat, the development environment for Ethereum, MOOW contracts can be easily deployed and tested. The deployer key and admin key mentioned in the environment setup instructions refer to the accounts that have permissions to deploy the contracts and handle upgrades respectively.

This upgradeability is particularly beneficial as it allows the project to introduce new features, fix bugs, and modify the system according to the community's evolving needs. However, it also entails a higher level of responsibility, as a faulty upgrade could potentially harm users or disrupt the system's functioning.

# Tokens

| Name | Symbol | Decimals | Total Supply   | Mintable |
| ---- | ------ | -------- | -------------- | -------- |
| TIC  | TIC    | 8        | unlimited      | Yes      |
| TAC  | TAC    | 8        | 1,000,000,000  | No       |

# Deployment

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
