// TrackerQueries.ts
export const WALLET_BALANCE_QUERY = `
  query GetWalletBalance($address: ID!) {
    account(id: $address) {
      id
      positions(first: 100) {
        token {
          id
          symbol
          name
        }
        tokenAmount
        nativeSpent
        nativeReceived
      }
      trades(first: 1, orderBy: block, orderDirection: desc) {
        block
        timestamp
      }
    }
  }
`;

export const WALLET_TRADES_QUERY = `
  query GetWalletTrades($accounts: [ID!]!, $first: Int!, $skip: Int!) {
    trades(
      first: $first
      skip: $skip
      orderBy: block
      orderDirection: desc
      where: { account_in: $accounts }
    ) {
      id
      block
      timestamp
      isBuy
      account {
        id
      }
      token {
        id
        symbol
        name
      }
      priceNativePerTokenWad
      amountIn
      amountOut
      transaction {
        id
      }
    }
  }
`;

export const TOKEN_METRICS_QUERY = `
  query GetTokenMetrics($tokenId: ID!) {
    launchpadToken(id: $tokenId) {
      id
      name
      symbol
      totalSupply
      creator
      bondingCurve {
        targetRaise
        currentRaise
        graduatedAt
      }
      trades(first: 100, orderBy: block, orderDirection: desc) {
        id
        block
        timestamp
        isBuy
        account {
          id
        }
        priceNativePerTokenWad
        amountIn
        amountOut
      }
      launchpadPositions(first: 100) {
        account {
          id
        }
        tokenAmount
        nativeSpent
        nativeReceived
      }
    }
  }
`;

export const TRACKED_TOKENS_QUERY = `
  query GetTrackedTokens($accounts: [ID!]!) {
    launchpadPositions(
      first: 100
      where: { account_in: $accounts }
      orderBy: nativeSpent
      orderDirection: desc
    ) {
      token {
        id
        name
        symbol
        totalSupply
        creator
        bondingCurve {
          targetRaise
          currentRaise
          graduatedAt
        }
        trades(first: 1, orderBy: block, orderDirection: desc) {
          block
          timestamp
          priceNativePerTokenWad
        }
        launchpadPositions {
          account {
            id
          }
          tokenAmount
          nativeSpent
          nativeReceived
        }
      }
      account {
        id
      }
      tokenAmount
      nativeSpent
      nativeReceived
    }
  }
`;