import { expect } from "chai";
import { Interface, Contract, ZeroAddress } from "ethers";

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
  "function burnFrom(address account, uint256 amount) public returns (bool)",
  "function renounceOwnership() public",
  "function transferOwnership(address newOwner) public",
];

const deployContract = async (contractName, input = [], lib = {}) => {
  input.push({ gasLimit: 12000000 });
  const contract = await ethers.getContractFactory(contractName, lib);
  const { target } = await contract.deploy(...input);
  return target;
};

const connect = (target, user) => new Contract(target, ABI, user);

describe("TIC token contract", () => {
  const name = "TIC",
    symbol = "TIC",
    decimals = 8,
    amount = 10e8,
    mintable = true;

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
    const iface = new Interface(abiProxy);
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

    it("Should transfer tokens between accounts using transferFrom method", async function () {
      let contract = connect(proxy, tokenOwner);
      const transferAmount = 50;

      // The owner approves user1 to spend transferAmount tokens on their behalf
      await contract.approve(user1.address, transferAmount);

      // Check that the allowance was correctly set
      let allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      expect(allowance).to.eq(transferAmount);

      // user1 transfers tokens from the owner's account to user2's account
      contract = connect(proxy, user1);
      await contract.transferFrom(
        tokenOwner.address,
        user2.address,
        transferAmount
      );

      // Check the balances
      let ownerBalance = await contract.balanceOf(tokenOwner.address);
      let user2Balance = await contract.balanceOf(user2.address);
      expect(ownerBalance).to.eq(amount - transferAmount);
      expect(user2Balance).to.eq(transferAmount);

      // Check that the allowance has decreased
      allowance = await contract.allowance(tokenOwner.address, user1.address);
      expect(allowance).to.eq(0);
    });

    it("Should fail if user1 tries to transfer more tokens than the allowance", async function () {
      let contract = connect(proxy, tokenOwner);
      const transferAmount = 100;

      // The owner approves user1 to spend 50 tokens on their behalf
      await contract.approve(user1.address, 50);

      // Check that the allowance was correctly set
      let allowance = await contract.allowance(
        tokenOwner.address,
        user1.address
      );
      expect(allowance).to.eq(50);

      // user1 tries to transfer 100 tokens from the owner's account to user2's account
      contract = connect(proxy, user1);
      try {
        await contract.transferFrom(
          tokenOwner.address,
          user2.address,
          transferAmount
        );
      } catch (error) {
        expect(error.message).to.include("transfer amount exceeds allowance");
      }
    });
  });

  describe("Minting", () => {
    it("Should mint tokens when the contract is mintable", async function () {
      const contract = connect(proxy, tokenOwner);

      // Before minting
      const oldSupply = await contract.totalSupply();
      const oldBalance = await contract.balanceOf(tokenOwner.address);

      const mintAmount = BigInt(100);
      // Minting new tokens
      await contract.mint(mintAmount);

      // After minting
      const newSupply = await contract.totalSupply();
      const newBalance = await contract.balanceOf(tokenOwner.address);

      expect(newSupply).to.equal(oldSupply + mintAmount);
      expect(newBalance).to.equal(oldBalance + mintAmount);
    });
  });

  describe("Ownership", () => {
    it("Should transfer ownership", async () => {
      let contract = connect(proxy, tokenOwner);

      // Transfer ownership from tokenOwner to user1
      await contract.transferOwnership(user1.address);

      // Check new owner is user1
      expect(await contract.getOwner()).to.eq(user1.address);

      // Check that tokenOwner can no longer transfer ownership
      contract = connect(proxy, tokenOwner);
      try {
        await contract.transferOwnership(user2.address);
        throw new Error("tokenOwner should not be able to transfer ownership");
      } catch (err) {
        expect(err.message).to.include("Ownable: caller is not the owner");
      }
    });

    it("Should renounce ownership", async () => {
      let contract = connect(proxy, tokenOwner);

      // Renounce ownership
      await contract.renounceOwnership();

      // Check new owner is zero address
      expect(await contract.getOwner()).to.eq(ZeroAddress);

      // Check that tokenOwner can no longer transfer ownership
      contract = connect(proxy, tokenOwner);
      try {
        await contract.transferOwnership(user1.address);
        throw new Error("tokenOwner should not be able to transfer ownership");
      } catch (err) {
        expect(err.message).to.include("Ownable: caller is not the owner");
      }
    });
  });

  describe("Burn Functionality", () => {
    it("Should burn tokens from owner", async function () {
      let amount = 100n;
      let contract = connect(proxy, tokenOwner);
      let totalSupply = await contract.totalSupply();
      const initialOwnerBalance = await contract.balanceOf(tokenOwner.address);

      // Burn 100 tokens from owner
      await contract.burn(amount);

      // Check owner's balance
      expect(await contract.balanceOf(tokenOwner.address)).to.equal(
        initialOwnerBalance - amount
      );

      // Check total supply
      expect(await contract.totalSupply()).to.equal(totalSupply - amount);
    });

    it("Should not allow non-owner to burn tokens", async function () {
      let contract = connect(proxy, user1);

      // Attempt to burn 50 tokens from user1 (should fail)
      try {
        await contract.burn(50);
        throw new Error("Expected an error but did not get one");
      } catch (err) {
        expect(err).to.be.an("Error");
      }
    });
  }); 
});
