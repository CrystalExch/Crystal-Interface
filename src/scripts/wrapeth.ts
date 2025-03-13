import { TokenAbi } from '../abis/TokenAbi';
import { encodeFunctionData } from 'viem';

const wrapeth = async (sendUserOperation: any, amount: bigint, weth: `0x${string}`) =>
  sendUserOperation({
    uo: {
      target: weth,
      data: encodeFunctionData({
        abi: TokenAbi,
        functionName: 'deposit',
      }),
      value: amount,
    },
  })

export default wrapeth;
