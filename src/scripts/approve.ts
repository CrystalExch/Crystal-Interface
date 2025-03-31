import { TokenAbi } from '../abis/TokenAbi';
import { encodeFunctionData } from 'viem';

const approve = (token: `0x${string}`, address: `0x${string}`, amount: bigint) => {
  return {
    target: token,
    data: encodeFunctionData({
      abi: TokenAbi,
      functionName: 'approve',
      args: [address, amount],
    }),
    value: 0n,
  }
}

export default approve;
