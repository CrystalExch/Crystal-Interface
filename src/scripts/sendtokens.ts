import { TokenAbi } from '../abis/TokenAbi';
import { encodeFunctionData } from 'viem';

const sendtokens = async (sendUserOperation: any, token: `0x${string}`, address: `0x${string}`, amount: bigint) =>
  sendUserOperation({
    uo: {
      target: token,
      data: encodeFunctionData({
        abi: TokenAbi,
        functionName: 'transfer',
        args: [address, amount],
      }),
      value: 0n,
    },
  })

export default sendtokens;
