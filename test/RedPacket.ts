import { parseEther } from "viem"
import { expect } from "chai"
import hre from "hardhat"

describe("RedPacket", function () {
  let redPacket: any
  let owner: any
  let giver: any
  let recipient1: any
  let recipient2: any
  let recipient3: any
  let erc20Mock: any

  const totalAmount = parseEther("100")

  async function deployRedPacketFixture() {
    const [owner, giver, recipient1, recipient2, recipient3] =
      await hre.viem.getWalletClients()

    const redPacket = await hre.viem.deployContract("RedPacket")
    const erc20Mock = await hre.viem.deployContract("Token", [
      "USDC Token",
      "USDC",
      18,
    ])

    // Mint usdc to giver
    await erc20Mock.write.mint([giver.account.address, parseEther("1000")])

    const publicClient = await hre.viem.getPublicClient()

    return {
      redPacket,
      erc20Mock,
      owner,
      giver,
      recipient1,
      recipient2,
      recipient3,
      publicClient,
    }
  }

  beforeEach(async function () {
    const info = await deployRedPacketFixture()
    redPacket = info.redPacket
    owner = info.owner
    giver = info.giver
    recipient1 = info.recipient1
    recipient2 = info.recipient2
    recipient3 = info.recipient3
    erc20Mock = info.erc20Mock
    // console.log("recipient1", recipient1)
    // console.log("recipient2", recipient2)
    // console.log("recipient3", recipient3)
  })

  describe("createGroup", function () {
    it("should create a new group with recipients and names", async function () {
      const groupName = "GroupA"
      const recipients = [
        recipient1.account.address,
        recipient2.account.address,
      ]
      const names = ["Bob", "Alice"]

      // Call the createGroup function
      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver.account.address,
      })

      // Fetch the group details from the contract
      const packetGiver = await redPacket.read.getPacketGiver([groupName])

      // Assert the details
      console.log("packetGiver", packetGiver)
      console.log("giver.account.address", giver.account.address)
      expect(packetGiver.toUpperCase()).to.equal(
        giver.account.address.toUpperCase()
      )

      const recipientIndexes = await redPacket.read.getPacketRecipientIndexes([
        groupName,
      ])
      expect(recipientIndexes).to.be.an("array")

      // Check each recipient
      const [recipient0Addr, recipient0Name] =
        await redPacket.read.getPacketRecipient([groupName, 0])
      const [recipient1Addr, recipient1Name] =
        await redPacket.read.getPacketRecipient([groupName, 1])

      expect(recipient0Addr.toUpperCase()).to.equal(recipients[0].toUpperCase())
      expect(recipient0Name).to.equal(names[0])
      expect(recipient1Addr.toUpperCase()).to.equal(recipients[1].toUpperCase())
      expect(recipient1Name).to.equal(names[1])
    })

    it("should revert if recipients and names length mismatch", async function () {
      const groupName = "GroupA"
      const recipients = [
        recipient1.account.address,
        recipient2.account.address,
      ]
      const names = ["Bob"]

      await expect(
        redPacket.write.createGroup([groupName, recipients, names])
      ).to.be.rejectedWith("Recipients and names length mismatch")
    })

    it("should revert if less than 2 recipients provided", async function () {
      const groupName = "GroupA"
      const recipients = [recipient1.account.address]

      await expect(
        redPacket.write.createGroup([groupName, recipients, []])
      ).to.be.rejectedWith("Must provide at least 2 addresses")
    })
  })

  describe("distributePacket", function () {
    it("should distribute tokens to recipients according to randomAmount function", async function () {
      const groupName = "GroupA"
      const recipients = [
        recipient1.account.address,
        recipient2.account.address,
      ]
      const names = ["Bob", "Alice"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver.account.address,
      })

      // Approve RedPacket contract to spend tokens
      await erc20Mock.write.approve([redPacket.address, totalAmount], {
        account: giver.account.address,
      })

      // Distribute tokens by giver
      await redPacket.write.distributePacket(
        [groupName, erc20Mock.address, totalAmount],
        {
          account: giver.account.address,
        }
      )

      // Check balances of recipients
      const balanceRecipient1 = await erc20Mock.read.balanceOf([
        recipient1.account.address,
      ])
      const balanceRecipient2 = await erc20Mock.read.balanceOf([
        recipient2.account.address,
      ])

      expect(balanceRecipient1 > parseEther("1")).to.be.true
      expect(balanceRecipient2 > parseEther("1")).to.be.true
    })

    it("should revert if non-giver tries to distributePacket", async function () {
      const groupName = "GroupA"
      const recipients = [
        recipient1.account.address,
        recipient2.account.address,
      ]
      const names = ["Bob", "Alice"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver.account.address,
      })

      // Mint tokens to recipient1
      await erc20Mock.write.mint([recipient1.account.address, totalAmount])

      // Approve RedPacket contract to spend tokens by recipient1
      await erc20Mock.write.approve([redPacket.address, totalAmount], {
        account: recipient1.account.address,
      })

      // Non-giver tries to distributePacket by recipient1
      await expect(
        redPacket.write.distributePacket(
          [groupName, erc20Mock.address, totalAmount],
          { account: recipient1.account.address }
        )
      ).to.be.rejectedWith("Only the giver can distribute the packet")
    })

    it("should revert if insufficient tokens approved for distribution", async function () {
      const groupName = "GroupA"
      const recipients = [
        recipient1.account.address,
        recipient2.account.address,
      ]
      const names = ["Bob", "Alice"]

      await redPacket.write.createGroup([groupName, recipients, names], {
        account: giver.account.address,
      })

      // Mint tokens to giver
      await erc20Mock.write.mint([giver.account.address, totalAmount], {
        account: giver.account.address,
      })

      // Approve RedPacket contract to spend insufficient tokens
      await erc20Mock.write.approve([redPacket.address, parseEther("50")], {
        account: giver.account.address,
      })

      // Distribute tokens should revert due to insufficient approval
      await expect(
        redPacket.write.distributePacket(
          [groupName, erc20Mock.address, totalAmount],
          { account: giver.account.address }
        )
      ).to.be.rejectedWith(/ERC20.*allowance|ERC20InsufficientAllowance/)
    })
  })
})
