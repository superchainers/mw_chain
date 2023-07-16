import { expect } from "chai";

const ABI = [
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function isBlacklisted(address account) public view returns (bool)",
];

const deployContract = async (contractName, input = [], lib = {}) => {
  input.push({ gasLimit: 12000000 });
  const contract = await ethers.getContractFactory(contractName, lib);
  const { target } = await contract.deploy(...input);
  return target;
};

const connect = (target, user) => new ethers.Contract(target, ABI, user);

/**
 * @dev This test case will first ensure that the anti-bot mechanism is correctly blacklisting non-owner addresses that attempt to transfer before the start_block.
 * It then checks that the owner address is able to make transfers before the start_block without being blacklisted.
 */
describe("Anti-bot", function () {
  // Token params
  const name = "TIC",
    symbol = "TIC",
    decimals = 8,
    amount = 10e8,
    mintable = true,
    start_block = 10; // Set start_block as 10

  let logic, proxy, tokenOwner, proxyAdmin, liquidityPool, user1, user2;

  beforeEach(async () => {
    [tokenOwner, proxyAdmin, liquidityPool, user1, user2] =
      await ethers.getSigners();
    logic = await deployContract("BEP20TokenImplementation");
    const abiProxy = [
      `function initialize(
    string memory name,
    string memory symbol,
    uint8 decimals,
    uint256 amount,
    bool mintable,
    address owner,
    uint256 start_block
    )`,
    ];
    const iface = new ethers.Interface(abiProxy);
    const data = iface.encodeFunctionData("initialize", [
      name,
      symbol,
      decimals,
      amount,
      mintable,
      tokenOwner.address,
      start_block,
    ]);
    proxy = await deployContract("BEP20UpgradeableProxy", [
      logic,
      proxyAdmin.address,
      data,
    ]);
  });

  it("Should allow owner to transfer before start_block", async () => {
    // Get the contract instance
    const contract = connect(proxy, tokenOwner);

    // Transfer some tokens from owner address (tokenOwner) to another address (user1)
    const ownerContract = connect(proxy, tokenOwner);
    await ownerContract.transfer(user1.address, 10);

    // Check that the transfer went through
    const user1Balance = await contract.balanceOf(user1.address);
    expect(user1Balance).to.eq(10);

    // Check that tokenOwner is not blacklisted
    const isBlacklisted = await contract.isBlacklisted(tokenOwner.address);
    expect(isBlacklisted).to.eq(false);
  });

  it("Should blacklist non-owner addresses that transfer before start_block", async () => {
    const amount = 100n;
    // Transfer some tokens from owner address (tokenOwner) to liquidity pool address (liquidityPool)
    const ownerContract = connect(proxy, tokenOwner);
    await ownerContract.transfer(liquidityPool.address, amount);

    // Check that the transfer went through
    const liquidityPoolBalance = await ownerContract.balanceOf(
      liquidityPool.address
    );
    expect(liquidityPoolBalance).to.eq(amount);

    // Transfer some tokens from liquidity pool address (liquidityPool) to another address (user1)
    const liquidityPoolContract = connect(proxy, liquidityPool);
    await liquidityPoolContract.transfer(user1.address, amount);

    // Check if user1.address has been blacklisted
    const isBlacklisted = await ownerContract.isBlacklisted(user1.address);
    expect(isBlacklisted).to.eq(true);
  });

  it("Should allow non-owner to recive tokens after start_block", async () => {
    const amount = 100n;
    let currentBlock = await ethers.provider.getBlockNumber();

    // Check that the current block is less than the start_block
    expect(currentBlock).to.be.lessThan(start_block);

    // Transfer some tokens from owner address (tokenOwner) to liquidity pool address (liquidityPool)
    const ownerContract = connect(proxy, tokenOwner);
    await ownerContract.transfer(liquidityPool.address, amount * 2n);

    currentBlock = await ethers.provider.getBlockNumber();
    while (currentBlock < start_block) {
      await ethers.provider.send("evm_mine"); // Manually increase block number
      await ethers.provider.send("evm_increaseTime", [1000]); // Manually increase time
      currentBlock = await ethers.provider.getBlockNumber();
    }

    // Check that the current block is greater than or equal to the start_block
    expect(currentBlock).to.be.gte(start_block);

    // Transfer some tokens from liquidity pool address (liquidityPool) to another address (user1)
    const liquidityPoolContract = connect(proxy, liquidityPool);
    await liquidityPoolContract.transfer(user1.address, amount);

    // Check if user1.address has not been blacklisted
    const isBlacklisted = await ownerContract.isBlacklisted(user1.address);
    expect(isBlacklisted).to.eq(false);

    // Transfer some tokens from liquidity pool address (liquidityPool) to another address (user1)
    await liquidityPoolContract.transfer(user2.address, amount);

    // Check if user2.address has not been blacklisted
    const isBlacklisted2 = await ownerContract.isBlacklisted(user2.address);
    expect(isBlacklisted2).to.eq(false);
  });
});
