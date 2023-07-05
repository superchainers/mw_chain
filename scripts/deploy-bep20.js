import hardhat from "hardhat";

const { ethers, run } = hardhat;

const [tokenOwner, proxyAdmin] = await ethers.getSigners();

const logic = await ethers.deployContract("BEP20TokenImplementation");

const iface = new ethers.Interface([
  `function initialize(
  string memory name,
  string memory symbol,
  uint8 decimals,
  uint256 amount,
  bool mintable,
  address owner,
  uint256 start_block
  )`,
]);

const {
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  TOKEN_TOTAL_SUPPLY,
  TOKEN_MINTABLE,
  TOKEN_START_BLOCK,
} = process.env;

console.table({
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  TOKEN_TOTAL_SUPPLY,
  TOKEN_MINTABLE,
  TOKEN_START_BLOCK,
});

const data = iface.encodeFunctionData("initialize", [
  TOKEN_NAME,
  TOKEN_SYMBOL,
  TOKEN_DECIMALS,
  TOKEN_TOTAL_SUPPLY,
  TOKEN_MINTABLE,
  tokenOwner.address,
  TOKEN_START_BLOCK,
]);

await logic.waitForDeployment();

const proxy = await ethers.deployContract("BEP20UpgradeableProxy", [
  logic.target,
  proxyAdmin.address,
  data,
]);

await proxy.waitForDeployment();

console.log("Proxy deployed to:", proxy.target);
console.log("Logic deployed to:", logic.target);
console.log("Token owner:", tokenOwner.address);
console.log("Proxy admin:", proxyAdmin.address);

await run("verify:verify", {
  address: proxy.target,
  constructorArguments: [logic.target, proxyAdmin.address, data],
  contract: "contracts/bep20/BEP20UpgradeableProxy.sol:BEP20UpgradeableProxy",
});

await run("verify:verify", {
  address: logic.target,
  constructorArguments: [],
  contract: "contracts/bep20/BEP20TokenImplementation.sol:BEP20TokenImplementation",
});
