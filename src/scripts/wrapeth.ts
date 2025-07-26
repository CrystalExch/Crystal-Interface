import { TokenAbi } from '../abis/TokenAbi';
import { encodeFunctionData } from 'viem';

const wrapeth = (amount: bigint, weth: `0x${string}`) => {
  return {
    target: weth,
    data: encodeFunctionData({
      abi: TokenAbi,
      functionName: 'deposit',
    }),
    value: amount,
  }
}

export default wrapeth;
