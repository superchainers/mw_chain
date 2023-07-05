# BEP-20 Smart Contract Documentation

## Overview

BEP-20 is a token standard on the Binance Smart Chain (BSC), allowing the deployment of fungible tokens. This standard is very similar to Ethereum's ERC-20, providing a consistent interface that enables seamless interaction with tokens within the ecosystem. 

This document will guide you through the essential parts of a BEP-20 compliant smart contract.

### Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting up the Contract](#setting-up-the-contract)
3. [Mandatory Functions](#mandatory-functions)
4. [Optional Functions](#optional-functions)
5. [Events](#events)
6. [Deployment](#deployment)

### Prerequisites <a name="prerequisites"></a>

Before you start, make sure that you have:

1. A basic understanding of Solidity and smart contracts
2. Installed an Ethereum development environment like Truffle or Hardhat
3. Installed a BSC compatible wallet like Metamask

### Setting up the Contract <a name="setting-up-the-contract"></a>

A BEP-20 contract is a Solidity contract. A minimal contract looks like this:

```solidity
pragma solidity >=0.4.22 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}
```

Here, the contract `MyToken` is a BEP-20 token that uses the OpenZeppelin ERC20 implementation as a base.

### Mandatory Functions <a name="mandatory-functions"></a>

According to the BEP-20 standard, there are several mandatory functions that each contract must implement:

- `totalSupply()`: Returns the total token supply.
- `balanceOf(address _owner)`: Returns the account balance of another account with address `_owner`.
- `transfer(address _to, uint256 _value)`: Transfers `_value` amount of tokens to address `_to`, and MUST fire the `Transfer` event.
- `transferFrom(address _from, address _to, uint256 _value)`: Transfers `_value` amount of tokens from address `_from` to address `_to`, and MUST fire the `Transfer` event.
- `approve(address _spender, uint256 _value)`: Allows `_spender` to withdraw from your account multiple times, up to the `_value` amount. If this function is called again, it overwrites the current allowance with `_value`.
- `allowance(address _owner, address _spender)`: Returns the amount which `_spender` is still allowed to withdraw from `_owner`.

### Optional Functions <a name="optional-functions"></a>

There are also a few optional functions according to the BEP-20 standard:

- `name()`: Returns the name of the token - e.g., `"MyToken"`.
- `symbol()`: Returns the symbol of the token - e.g., `"MTK"`.
- `decimals()`: Returns the number of decimals the token uses - e.g., `18`, means to divide the token amount by `1e18` to get its user representation.

### Events <a name="events"></a>

Two events MUST be fired on any successful call to `transfer(...)` and `transferFrom(...)`

- `Transfer(address indexed _from, address indexed _to, uint256 _value)`: MUST trigger when tokens are transferred, including zero-value transfers.
- `Approval(address indexed _owner, address indexed _spender, uint256 _value)`: MUST trigger on any successful call