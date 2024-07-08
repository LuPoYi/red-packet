import { Address, parseEther } from "viem"
import { expect } from "chai"
import hre from "hardhat"

describe("RedPacket", function () {
  let redPacket: any
  let giver: Address
  let recipient1: Address
  let recipient2: Address
  let recipient3: Address
  let erc20Mock: any

  const totalAmount = parseEther("100")
  const groupName = "GroupA"

  async function deployRedPacketFixture() {
    const [
      giverWalletClient,
      recipient1WalletClient,
      recipient2WalletClient,
      recipient3WalletClient,
    ] = await hre.viem.getWalletClients()

    const redPacket = await hre.viem.deployContract("RedPacket")
    const erc20Mock = await hre.viem.deployContract("Token", [
      "USDC Token",
      "USDC",
      18,
    ])

    // Mint usdc to giver
    await erc20Mock.write.mint([
      giverWalletClient.account.address,
      parseEther("1000"),
    ])

    const publicClient = await hre.viem.getPublicClient()

    return {
      redPacket,
      erc20Mock,
      giver: giverWalletClient.account.address,
      recipient1: recipient1WalletClient.account.address,
      recipient2: recipient2WalletClient.account.address,
      recipient3: recipient3WalletClient.account.address,
      publicClient,
    }
  }

  beforeEach(async function () {
    const info = await deployRedPacketFixture()
    redPacket = info.redPacket
    giver = info.giver
    recipient1 = info.recipient1
    recipient2 = info.recipient2
    recipient3 = info.recipient3
    erc20Mock = info.erc20Mock
  })

  describe("createGroup", function () {
    it("should create a new group with recipients and names", async function () {
      const recipients = [recipient1, recipient2, recipient3]
      const names = ["Bob", "Alice", "Charlie"]

      // Call the createGroup function
      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver,
      })

      // Fetch the group details from the contract
      const packetGiver = await redPacket.read.getPacketGiver([groupName])

      // Assert the details

      expect(packetGiver.toUpperCase()).to.equal(giver.toUpperCase())

      const recipientIndexes = await redPacket.read.getPacketRecipientIndexes([
        groupName,
      ])
      expect(recipientIndexes).to.be.an("array")

      // Check each recipient
      const [recipient0Addr, recipient0Name] =
        await redPacket.read.getPacketRecipient([groupName, 0])
      const [recipient1Addr, recipient1Name] =
        await redPacket.read.getPacketRecipient([groupName, 1])
      const [recipient2Addr, recipient2Name] =
        await redPacket.read.getPacketRecipient([groupName, 2])

      expect(recipient0Addr.toUpperCase()).to.equal(recipients[0].toUpperCase())
      expect(recipient0Name).to.equal(names[0])
      expect(recipient1Addr.toUpperCase()).to.equal(recipients[1].toUpperCase())
      expect(recipient1Name).to.equal(names[1])
      expect(recipient2Addr.toUpperCase()).to.equal(recipients[2].toUpperCase())
      expect(recipient2Name).to.equal(names[2])
    })

    it("should revert if recipients and names length mismatch", async function () {
      const recipients = [recipient1, recipient2, recipient3]
      const names = ["Bob"]

      await expect(
        redPacket.write.createGroup([groupName, recipients, names])
      ).to.be.rejectedWith("Recipients and names length mismatch")
    })

    it("should revert if less than 2 recipients provided", async function () {
      const recipients = [recipient1]
      const names = ["Bob"]

      await expect(
        redPacket.write.createGroup([groupName, recipients, []])
      ).to.be.rejectedWith("Must provide at least 2 addresses")
    })
  })

  describe("distributePacket", function () {
    it("should distribute tokens to recipients according to randomAmount function", async function () {
      const recipients = [recipient1, recipient2, recipient3]
      const names = ["Bob", "Alice", "Charlie"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver,
      })

      // Approve RedPacket contract to spend tokens
      await erc20Mock.write.approve([redPacket.address, totalAmount], {
        account: giver,
      })

      // Distribute tokens by giver
      await redPacket.write.distributePacket(
        [groupName, erc20Mock.address, totalAmount],
        { account: giver }
      )

      // Check balances of recipients
      const balanceRecipient1 = await erc20Mock.read.balanceOf([recipient1])
      const balanceRecipient2 = await erc20Mock.read.balanceOf([recipient2])
      const balanceRecipient3 = await erc20Mock.read.balanceOf([recipient3])

      expect(balanceRecipient1 > parseEther("1")).to.be.true
      expect(balanceRecipient2 > parseEther("1")).to.be.true
      expect(balanceRecipient3 > parseEther("1")).to.be.true
    })

    it("should revert if non-giver tries to distributePacket", async function () {
      const recipients = [recipient1, recipient2, recipient3]
      const names = ["Bob", "Alice", "Charlie"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver,
      })

      // Mint tokens to recipient1
      await erc20Mock.write.mint([recipient1, totalAmount])

      // Approve RedPacket contract to spend tokens by recipient1
      await erc20Mock.write.approve([redPacket.address, totalAmount], {
        account: recipient1,
      })

      // Non-giver tries to distributePacket by recipient1
      await expect(
        redPacket.write.distributePacket(
          [groupName, erc20Mock.address, totalAmount],
          { account: recipient1 }
        )
      ).to.be.rejectedWith("Only the giver can distribute the packet")
    })

    it("should revert if insufficient tokens approved for distribution", async function () {
      const recipients = [recipient1, recipient2, recipient3]
      const names = ["Bob", "Alice", "Charlie"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver,
      })

      // Mint tokens to giver
      await erc20Mock.write.mint([giver, totalAmount], { account: giver })

      // Approve RedPacket contract to spend insufficient tokens
      await erc20Mock.write.approve([redPacket.address, parseEther("50")], {
        account: giver,
      })

      // Distribute tokens should revert due to insufficient approval
      await expect(
        redPacket.write.distributePacket(
          [groupName, erc20Mock.address, totalAmount],
          { account: giver }
        )
      ).to.be.rejectedWith(/ERC20.*allowance|ERC20InsufficientAllowance/)
    })
  })
})
