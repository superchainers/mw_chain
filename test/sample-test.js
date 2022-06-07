const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deploy", function () {
  it("Should deploy contract", async function () {
    const Greeter = await ethers.getContractFactory("BEP20TokenImplementation");
    const greeter = await Greeter.deploy();
    const contract = await greeter.deployed();

    expect(contract.address).exist();
  });
});
