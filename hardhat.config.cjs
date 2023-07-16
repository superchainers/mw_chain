require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

const bscTestnet = {
  url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  chainId: 97,
  accounts: [process.env.DEPLOYER_KEY, process.env.ADMIN_KEY],
};

const bscMainnet = {
  url: "https://bsc-dataseed.binance.org/",
  chainId: 56,
  accounts: [process.env.DEPLOYER_KEY, process.env.ADMIN_KEY],
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    // testnet: bscTestnet,
    // mainnet: bscMainnet,
  },
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: process.env.BSCSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
    },
  },
};
