import { settings } from '../../settings';

export type GqlPosition = {
  tokenId: string;
  symbol?: string;
  name?: string;
  imageUrl?: string;
  boughtTokens: number;
  soldTokens: number;
  spentNative: number;
  receivedNative: number;
  remainingTokens: number;
  remainingPct: number;
  pnlNative: number;
  lastPrice: number;
};

type GqlWallet = { address: string; nativeBalance: number; positions: GqlPosition[] };
type GqlResp = { data?: { wallet?: GqlWallet } };

const Q = `
query AddressPortfolio($address: String!) {
  wallet(address: $address) {
    address
    nativeBalance
    positions {
      tokenId
      symbol
      name
      imageUrl
      boughtTokens
      soldTokens
      spentNative
      receivedNative
      remainingTokens
      remainingPct
      pnlNative
      lastPrice
    }
  }
}`;

const post = async <T,>(body: any) => {
  const url =
    (settings as any).graphqlUrl ||
    (settings as any).api?.graphqlUrl;

  if (!url) throw new Error('Missing settings.graphqlUrl');

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  return (await r.json()) as T;
};

export const fetchPortfolio = async (address: string) => {
  const r = await post<GqlResp>({ query: Q, variables: { address } });
  return r?.data?.wallet || null;
};
