// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RedPacket is Ownable {
    struct Recipient {
        address addr;
        string name;
    }

    struct Packet {
        address giver;
        uint[] recipientIndexes; // Stores indexes to recipients
        mapping(uint => Recipient) recipients; // Maps index to Recipient
    }

    mapping(string => Packet) public packets;

    event GroupCreated(
        string groupName,
        address giver,
        address[] recipients,
        string[] names
    );
    event PacketDistributed(string groupName, address token, uint totalAmount);

    constructor() Ownable(msg.sender) {}

    function createGroup(
        string memory groupName,
        address[] memory recipients,
        string[] memory names
    ) external {
        require(recipients.length >= 2, "Must provide at least 2 addresses");
        require(
            recipients.length == names.length,
            "Recipients and names length mismatch"
        );

        Packet storage packet = packets[groupName];
        packet.giver = msg.sender;

        // Initialize recipients and store indexes
        for (uint i = 0; i < recipients.length; i++) {
            packet.recipients[i] = Recipient({
                addr: recipients[i],
                name: names[i]
            });
            packet.recipientIndexes.push(i);
        }

        emit GroupCreated(groupName, msg.sender, recipients, names);
    }

    function distributePacket(
        string memory groupName,
        address token,
        uint totalAmount
    ) external {
        Packet storage packet = packets[groupName];
        require(
            packet.giver == msg.sender,
            "Only the giver can distribute the packet"
        );

        IERC20 erc20 = IERC20(token);
        uint balanceBefore = erc20.balanceOf(address(this));
        erc20.transferFrom(msg.sender, address(this), totalAmount);
        uint balanceAfter = erc20.balanceOf(address(this));
        require(
            balanceAfter - balanceBefore == totalAmount,
            "Token transfer failed"
        );

        uint remainingAmount = totalAmount;

        // Distribute tokens to recipients based on stored indexes
        for (uint i = 0; i < packet.recipientIndexes.length; i++) {
            uint index = packet.recipientIndexes[i];
            uint amount = randomAmount(
                remainingAmount,
                packet.recipientIndexes.length - i
            );
            erc20.transfer(packet.recipients[index].addr, amount);
            remainingAmount -= amount;
        }

        emit PacketDistributed(groupName, token, totalAmount);
    }

    function randomAmount(
        uint remainingAmount,
        uint remainingRecipients
    ) internal view returns (uint) {
        if (remainingRecipients == 1) {
            return remainingAmount;
        }
        uint max = (remainingAmount / remainingRecipients) * 2;
        uint rand = uint(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    remainingAmount,
                    remainingRecipients
                )
            )
        );
        return (rand % max) + 1;
    }

    function getPacketGiver(
        string memory packetId
    ) public view returns (address) {
        return packets[packetId].giver;
    }

    function getPacketRecipientIndexes(
        string memory packetId
    ) public view returns (uint[] memory) {
        return packets[packetId].recipientIndexes;
    }

    function getPacketRecipient(
        string memory packetId,
        uint index
    ) public view returns (address, string memory) {
        Recipient memory recipient = packets[packetId].recipients[index];
        return (recipient.addr, recipient.name);
    }
}
