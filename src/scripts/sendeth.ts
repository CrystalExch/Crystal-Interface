const sendeth = async (sendUserOperation: any, address: `0x${string}`, amount: bigint) =>
  sendUserOperation({
    uo: {
      target: address,
      data: '0x',
      value: amount,
    },
  })

export default sendeth;
