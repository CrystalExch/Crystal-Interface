import { getAddress as checksum } from 'viem';

export default function getAddress(address: string) {
  if (!/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    return '';
  } else return checksum(address);
}
