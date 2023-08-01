import { expect } from "chai";

const ABI = [
  "function symbol() external view returns (string memory)",
  "function name() external view returns (string memory)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function mintable() external view returns (bool)",
  "function getOwner() external view returns (address)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
  "function increaseAllowance(address spender, uint256 addedValue) public returns (bool)",
  "function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool)",
  "function mint(uint256 amount) public returns (bool)",
  "function burn(uint256 amount) public returns (bool)",
  "function renounceOwnership() public",
  "function transferOwnership(address newOwner) public",
];

const deployContract = async (contractName, input = [], lib = {}) => {
  input.push({ gasLimit: 12000000 });
  const contract = await ethers.getContractFactory(contractName, lib);
  const { target } = await contract.deploy(...input);
  return target;
};

const connect = (target, user) => new ethers.Contract(target, ABI, user);

describe("TAC token contract", () => {
  const name = "TAC",
    symbol = "TAC",
    decimals = 8,
    amount = 10e8,
    mintable = false;

  let logic, proxy, tokenOwner, proxyAdmin, user1, user2, addrs;

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    [tokenOwner, proxyAdmin, user1, user2, ...addrs] =
      await ethers.getSigners();

    logic = await deployContract("BEP20TokenImplementation");

    // ABI for proxy
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
      BigInt(0),
    ]);

    proxy = await deployContract("BEP20UpgradeableProxy", [
      logic,
      proxyAdmin.address,
      data,
    ]);
  });

  describe("Deployment", () => {
    it("Should correct initialize", async () => {
      const contract = connect(proxy, user1);
      expect(await contract.symbol()).to.eq(symbol);
      expect(await contract.name()).to.eq(name);
      expect(await contract.decimals()).to.eq(decimals);
      expect(await contract.totalSupply()).to.eq(amount);
      expect(await contract.mintable()).to.eq(mintable);
      expect(await contract.getOwner()).to.eq(tokenOwner.address);
      expect(await contract.balanceOf(tokenOwner.address)).to.eq(amount);
      expect(await contract.balanceOf(user1.address)).to.eq(0);
      expect(await contract.balanceOf(user2.address)).to.eq(0);
    });
  });

  describe("Transactions", () => {
    it("Should transfer tokens between accounts", async function () {
      let ownerBalance, user1Balance, user2Balance;
      // Transfer 50 tokens from owner to user1
      let contract = connect(proxy, tokenOwner);
      await contract.transfer(user1.address, 50);
      ownerBalance = await contract.balanceOf(tokenOwner.address);
      user1Balance = await contract.balanceOf(user1.address);
      expect(ownerBalance).to.equal(amount - 50);
      expect(user1Balance).to.equal(50);

      // Transfer 25 tokens from user1 to user2
      contract = connect(proxy, user1);
      await contract.transfer(user2.address, 25);
      user1Balance = await contract.balanceOf(user1.address);
      user2Balance = await contract.balanceOf(user2.address);
      expect(user1Balance).to.equal(25);
      expect(user2Balance).to.equal(25);
    });

    it("Should check allowance", async () => {
      let contract = connect(proxy, tokenOwner);

      const allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      expect(allowance).to.eq(0);
    });

    it("Should increase allowance", async () => {
      let contract = connect(proxy, tokenOwner);

      await contract.increaseAllowance(user1.address, 100);
      const allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      expect(allowance).to.eq(100);
    });

    it("Should decrease allowance", async () => {
      let contract = connect(proxy, tokenOwner);

      await contract.increaseAllowance(user1.address, 100);
      await contract.decreaseAllowance(user1.address, 50);
      const allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      expect(allowance).to.eq(50);
    });

    it("Should approve allowance", async () => {
      let contract = connect(proxy, tokenOwner);

      await contract.approve(user1.address, 5000);
      const allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      const user1Balance = await contract.balanceOf(user1.address);
      expect(allowance).to.eq(5000);
      expect(user1Balance).to.eq(0);
    });
  });

  describe("Minting", () => {
    it("Should fail to mint tokens when the contract is not mintable", async function () {
      const contract = connect(proxy, tokenOwner);
      const mintAmount = 100;

      if (!mintable) {
        await expect(contract.mint(mintAmount)).to.be.revertedWith(
          "BEP20: this token is not mintable"
        );
      }
    });
  });
});
