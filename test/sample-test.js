const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("XO", function () {
  this.timeout(10000)

  let owner
  let accOne
  let accTwo
  let XOContract
  const multEth = 1000000000000000000

  beforeEach(async function(){
    console.log("|     --------- Deploy ---------     |");
    [owner, accOne, accTwo] = await ethers.getSigners()
    const XO = await ethers.getContractFactory("XO", owner)
    XOContract = await XO.deploy()
    await XOContract.deployed()

    const ethOwnerBalance = await owner.getBalance()/multEth
    console.log("Contract address: ", XOContract.address)
    console.log("Owner: ", owner.address, "   | Account 1: ", accOne.address, "   | Account 2: ", accTwo.address)
    console.log('Ether spent: ', 10000 - ethOwnerBalance)
  })

  it("Add gamers and check games", async function() {
    console.log("|     --------- Add gamers and check games ---------     |")
    console.log("Balance start owner and first account: ", await accOne.getBalance()/multEth, "  -  ", await accTwo.getBalance()/multEth)
    await expect(XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("1")})).to.be.revertedWith('Rejected')
    await XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accTwo).buyAlocation({value: ethers.utils.parseEther("0.5")})
    console.log("Balance start owner and first account: ", await accOne.getBalance()/multEth, "  -  ", await accTwo.getBalance()/multEth)
    const game = await XOContract.getGamePlayers(1)
    expect(game[0]).to.equal(accOne.address)
    const inGame = await XOContract.getWhichGame(accTwo.address)
    expect(inGame).to.equal(1)
    console.log(inGame)
    await expect(XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("0.5")})).to.be.revertedWith('in Game')
  })

  it("Game 1", async function() {
    console.log("|     --------- Game 1 ---------     |")
    await XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accTwo).buyAlocation({value: ethers.utils.parseEther("0.5")})
    console.log("Balance gamers before: ", await accOne.getBalance()/multEth, "  -  ", await accTwo.getBalance()/multEth)
    let progress = await XOContract.getGameStats(1)
    console.log(progress)
    await XOContract.connect(accOne).addStep(0, 0)
    await expect(XOContract.connect(accOne).addStep(0, 1)).to.be.reverted
    await expect(XOContract.connect(accTwo).addStep(0, 0)).to.be.reverted
    await XOContract.connect(accTwo).addStep(0, 1)
    await expect(XOContract.connect(accTwo).addStep(1, 1)).to.be.reverted
    await expect(XOContract.connect(accOne).addStep(0, 0)).to.be.reverted
    progress = await XOContract.getGameStats(1)
    console.log(progress)
    await XOContract.connect(accOne).addStep(1, 1)
    await XOContract.connect(accTwo).addStep(1, 0)
    await XOContract.connect(accOne).addStep(2, 2)
    console.log("Balance gamers after: ", await accOne.getBalance()/multEth, "  -  ", await accTwo.getBalance()/multEth)
    await expect(XOContract.connect(accTwo).addStep(2, 1)).to.be.reverted
  })

  it("Game 2", async function() {
    console.log("|     --------- Game 2 ---------     |")
    await XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accTwo).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accOne).addStep(0, 1)
    await XOContract.connect(accTwo).addStep(0, 0)
    await XOContract.connect(accOne).addStep(1, 0)
    await XOContract.connect(accTwo).addStep(1, 1)
    await XOContract.connect(accOne).addStep(2, 1)
    await XOContract.connect(accTwo).addStep(2, 2)
  })

  it("Game 3", async function() {
    console.log("|     --------- Game 3 ---------     |")
    await XOContract.connect(accOne).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accTwo).buyAlocation({value: ethers.utils.parseEther("0.5")})
    await XOContract.connect(accOne).addStep(0, 1)
    await XOContract.connect(accTwo).addStep(0, 0)
    await XOContract.connect(accOne).addStep(0, 2)
    await XOContract.connect(accTwo).addStep(1, 0)
    await XOContract.connect(accOne).addStep(2, 1)
    await XOContract.connect(accTwo).addStep(2, 2)
  })

  it("Owner test", async function() {
    console.log("|     --------- Owner test ---------     |")
    await expect(XOContract.connect(accOne).changeOwner(accTwo.address)).to.be.reverted
    console.log("Caller is not owner")
    console.log("Old owner", await XOContract.getOwner())
    await XOContract.changeOwner(accTwo.address)
    await expect(XOContract.getOwner()).to.be.reverted
    console.log("Caller is not owner")
    console.log("New owner Acc2", await XOContract.connect(accTwo).getOwner())

  })

  it("Wallet test", async function() {
    console.log("|     --------- Wallet test ---------     |")
    await XOContract.fallback({value: ethers.utils.parseEther("2")})
    await XOContract.connect(accOne).fallback({value: ethers.utils.parseEther("5")})
    await XOContract.connect(accOne).fallback({value: ethers.utils.parseEther("12")})
    console.log(await XOContract.getBalance()/multEth, await owner.getBalance()/multEth)
    expect(await XOContract.getBalance()/multEth).to.equal(19)
    await XOContract.withdraw(owner.address, XOContract.getBalance())
    expect(await XOContract.getBalance()/multEth).to.equal(0)
    console.log(await XOContract.getBalance()/multEth, await owner.getBalance()/multEth)
    await XOContract.setWallet(accTwo.address)
    expect(await XOContract.getWallet()).to.equal(accTwo.address)
    XOContract.fallback({value: ethers.utils.parseEther("0")})
  })

})


