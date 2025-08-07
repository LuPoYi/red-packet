"use client"

import { useEffect, useState } from 'react';

import { Erc20InfoType, erc20ABI, redPacketContractAddress } from '@/constants';
import { formatUnits } from 'viem';
import { readContracts, watchBlockNumber } from '@wagmi/core';
import { useAccount } from 'wagmi';
import { wagmiConfig } from '@/app/providers';

export default function useErc20Info(tokenAddresses: string[]) {
  const { address } = useAccount()
  const [erc20Infos, setErc20Infos] = useState<Record<string, Erc20InfoType>>()

  // useEffect(() => {
  //   if (!chain) return

  //   return watchBlockNumber(wagmiConfig, {
  //     onBlockNumber() {
  //       const fetchContract = async () => {
  //         const contractResp = await readContracts(wagmiConfig, {
  //           contracts: tokenAddresses.flatMap((tokenAddress) => [
  //             {
  //               address: tokenAddress as `0x${string}`,
  //               abi: erc20ABI,
  //               functionName: "symbol",
  //             },
  //             {
  //               address: tokenAddress as `0x${string}`,
  //               abi: erc20ABI,
  //               functionName: "decimals",
  //             },
  //             {
  //               address: tokenAddress as `0x${string}`,
  //               abi: erc20ABI,
  //               functionName: "balanceOf",
  //               args: [address as `0x${string}`],
  //             },
  //             {
  //               address: tokenAddress as `0x{string}`,
  //               abi: erc20ABI,
  //               functionName: "allowance",
  //               args: [address as `0x{string}`, redPacketContractAddress],
  //             },
  //           ]),
  //         })

  //         console.log("contractResp", contractResp)
  //         let _erc20Infos: Record<string, Erc20InfoType> = {}

  //         for (let i = 0; i < tokenAddresses.length; i++) {
  //           const tokenAddress = tokenAddresses[i]
  //           const symbol = contractResp[i * 4].result?.toString() || ""
  //           const decimals = contractResp[i * 4 + 1].result as number
  //           const balanceOf = contractResp[i * 4 + 2].result as bigint
  //           const allowance = contractResp[i * 4 + 3].result as bigint

  //           _erc20Infos[tokenAddress] = {
  //             decimals,
  //             symbol,
  //             amount: Number(formatUnits(balanceOf, decimals)),
  //             allowance: Number(formatUnits(allowance, decimals)),
  //           }
  //         }

  //         setErc20Infos(_erc20Infos)
  //       }

  //       fetchContract()
  //     },
  //   })
  // }, [])

  return { erc20Infos }
}
