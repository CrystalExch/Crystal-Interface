import { sendTransaction } from '@wagmi/core';
import { config } from '../wagmi';

const sendeth = async (x: `0x${string}`, y: bigint) =>
  sendTransaction(config, {
    to: x,
    value: y,
  });

export default sendeth;
