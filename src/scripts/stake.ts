import { shMonadAbi } from '../abis/shMonadAbi';
import { sMonAbi } from '../abis/sMonAbi';
import { encodeFunctionData } from 'viem';

const stake = (token: `0x${string}`, address: `0x${string}`, amount: bigint) => {
  return {
    target: token,
    data: token == '0xe1d2439b75fb9746E7Bc6cB777Ae10AA7f7ef9c5' ? encodeFunctionData({
      abi: sMonAbi,
      functionName: 'deposit',
      args: [0n, address],
    }) : encodeFunctionData({
      abi: shMonadAbi,
      functionName: 'deposit',
      args: [amount, address],
    }),
    value: amount,
  }
}

export default stake;
