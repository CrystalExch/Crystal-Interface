const sendeth = (address: `0x${string}`, amount: bigint) => {
  return {
    target: address,
    data: '0x',
    value: amount,
  }
}

export default sendeth;
