// NOTE: This subgraph doesn't have a top-level `trades` field.
// Query per-account and read each account's `trades`, then flatten on the client.

export const WALLET_TRADES_QUERY = `
  query WalletsTrades($accounts: [ID!]!, $n: Int!) {
    accounts(where: { id_in: $accounts }) {
      id
      trades(
        first: $n
        orderBy: timestamp
        orderDirection: desc
      ) {
        id
        timestamp
        isBuy
        amountIn
        amountOut
        priceNativePerTokenWad
        token { id symbol }
        transaction { id }
      }
    }
  }
`;

export const WALLET_TRADES_INC = `
  query WalletsTradesInc($acc: [ID!]!, $afterTs: BigInt!, $n: Int!) {
    accounts(where: { id_in: $acc }) {
      id
      trades(
        first: $n
        orderBy: timestamp
        orderDirection: asc
        where: { timestamp_gt: $afterTs }
      ) {
        id
        timestamp
        isBuy
        amountIn
        amountOut
        priceNativePerTokenWad
        token { id symbol }
        transaction { id }
      }
    }
  }
`;


export const WALLET_TRADES_SINCE = `
  query WalletTradesSince($acc: [ID!]!, $since: BigInt!, $n: Int!) {
    trades(
      first: $n
      orderBy: timestamp
      orderDirection: asc
      where: { account_in: $acc, timestamp_gte: $since }
    ) {
      id
      timestamp
      isBuy
      amountIn
      amountOut
      priceNativePerTokenWad
      account { id }
      token { id symbol }
      transaction { id }
    }
  }
`;

export const TOKEN_METRICS_QUERY = `
  query TokenMetrics($tokenId: ID!) {
    token(id: $tokenId) {
      id
      symbol
      name
      trades(first: 1, orderBy: timestamp, orderDirection: desc) {
        priceNativePerTokenWad
        timestamp
      }
      bondingCurve {
        targetRaise
        currentRaise
      }
      launchpadPositions {
        id
      }
    }
  }
`;

export const TRACKED_TOKENS_QUERY = `
  query TrackedTokens($accounts: [ID!]!) {
    launchpadPositions(where: { account_in: $accounts }) {
      id
      account { id }
      token {
        id
        name
        symbol
        bondingCurve {
          targetRaise
          currentRaise
        }
        trades(first: 200, orderBy: timestamp, orderDirection: desc) {
          id
          timestamp
          isBuy
          priceNativePerTokenWad
          account { id }
        }
        launchpadPositions {
          id
          account { id }
          nativeSpent
          nativeReceived
          tokenAmount
        }
      }
      nativeSpent
      nativeReceived
      tokenAmount
    }
  }
`;

export const WALLET_BALANCE_QUERY = `
  query WalletBalance($address: ID!) {
    account(id: $address) {
      id
      positions {
        id
        nativeSpent
        nativeReceived
        tokenAmount
        token {
          id
          symbol
        }
      }
      trades(first: 1, orderBy: timestamp, orderDirection: desc) {
        id
        timestamp
      }
    }
  }
`;

