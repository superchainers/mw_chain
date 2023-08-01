import { expect } from "chai";

const ABI = [
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
];

const deployContract = async (contractName, input = [], lib = {}) => {
  input.push({ gasLimit: 12000000 });
  const contract = await ethers.getContractFactory(contractName, lib);
  const { target } = await contract.deploy(...input);
  return target;
};

const connect = (target, user) => new ethers.Contract(target, ABI, user);

describe("Anti-bot", function () {
  // Token params
  const name = "TAC",
    symbol = "TAC",
    decimals = 8,
    amount = 1000000e8,
    mintable = false,
    start_block = 100;

  let logic, proxy, tokenOwner, proxyAdmin, user1, user2, user3;

  beforeEach(async () => {
    [tokenOwner, proxyAdmin, user1, user2, user3] = await ethers.getSigners();
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

  it("should not allow to transfer more than _maxTxValue", async () => {
    const moreThanMaxValue = 10_000_0000_0001;
    const owner = connect(proxy, tokenOwner);
    await owner.transfer(user1.address, moreThanMaxValue);
    const user = connect(proxy, user1);
    await expect(user.transfer(tokenOwner.address, moreThanMaxValue)).to.be.revertedWith(
      "Exceeded max transaction value"
    );
  });

  it.skip("should not allow more than 1 transaction per block", async () => {
    const owner = connect(proxy, tokenOwner);
    await owner.transfer(user1.address, 1000n);
    const user = connect(proxy, user1);

    // Prepare first transaction and mine it
    await ethers.provider.send("evm_setAutomine", [true]);
    await user.transfer(user2.address, 100n); // first transaction

    // Stop mining and prepare second transaction
    await ethers.provider.send("evm_setAutomine", [false]);
    const tx = user.transfer(user2.address, 500n); // second transaction prepared but not mined

    // increase time by 1 second to make sure the EVM considers the next transaction as being in the same block
    await ethers.provider.send("evm_increaseTime", [1]);

    // Mine second transaction and start automining again
    await ethers.provider.send("evm_mine");
    await ethers.provider.send("evm_setAutomine", [true]);

    // Verify the second transaction was reverted
    await expect(tx).to.be.revertedWith("Exceeded max transactions per block"); // should fail
  });
});
