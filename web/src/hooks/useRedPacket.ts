import { useEffect, useState } from 'react';

import {
  Erc20InfoType,
  erc20ABI,
  redPacketContractABI,
  redPacketContractAddress,
} from '@/constants';
import { formatUnits } from 'viem';
import { readContracts, watchBlockNumber } from '@wagmi/core';
import { useAccount } from 'wagmi';
import { wagmiConfig } from '@/app/providers';

const packetId = "GroupA"
// address[] recipients,
// string[] names

type recipientInfoType = {
  address: string
  name: string
}

export default function useRedPacket() {
  const [giver, setGiver] = useState<string>()
  const [recipientInfos, setRecipientInfos] = useState<recipientInfoType[]>()

  // ----- fetch red packet information -----
  useEffect(() => {
    const fetchContract = async () => {
      const contractResp = await readContracts(wagmiConfig, {
        contracts: [
          {
            address: redPacketContractAddress,
            abi: redPacketContractABI,
            functionName: "getPacketGiver",
            args: [packetId],
          },
          {
            address: redPacketContractAddress,
            abi: redPacketContractABI,
            functionName: "getPacketRecipientIndexes",
            args: [packetId],
          },
        ],
      })

      const _giver = contractResp[0].result?.toString()
      const _recipientIndexes = contractResp[1].result || []

      const contractResp2 = await readContracts(wagmiConfig, {
        contracts: _recipientIndexes.flatMap((index) => [
          {
            address: redPacketContractAddress,
            abi: redPacketContractABI,
            functionName: "getPacketRecipient",
            args: [packetId, index],
          },
        ]),
      })

      console.log("contractResp2", contractResp2)

      let _recipientInfos: recipientInfoType[] = []

      contractResp2.forEach(({ result }) => {
        if (!result) return

        _recipientInfos.push({
          address: result[0]?.toString(),
          name: result[1]?.toString(),
        })
      })

      setGiver(_giver)
      setRecipientInfos(_recipientInfos)
    }

    fetchContract()
  }, [])

  return { recipientInfos, giver }
}
