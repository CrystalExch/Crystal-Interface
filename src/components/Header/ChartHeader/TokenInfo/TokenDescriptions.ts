import { useLanguage } from '../../../../contexts/LanguageContext';
import { useSharedContext } from '../../../../contexts/SharedContext';
import { settings } from '../../../../settings.ts';

export interface TokenInfoData {
  name: string;
  image: string;
  description: string;
  website: string;
  twitter?: string;
  discord?: string;
  github?: string;
  baseAddress?: string;
}

export type TokenSymbol = string;

export function useTokenData(): Record<TokenSymbol, TokenInfoData> {
  const { t } = useLanguage();
  const { activechain } = useSharedContext();
  const tokendict = settings.chainConfig[activechain]?.tokendict ?? {};

  return Object.fromEntries(
    Object.values(tokendict)
      .filter(
        (token: any) =>
          token?.ticker &&
          (token?.descriptionKey ||
            token?.website ||
            token?.twitter ||
            token?.discord ||
            token?.github),
      )
      .map((token: any) => [
        token.ticker,
        {
          name: token.name,
          image: token.image,
          description: token.descriptionKey ? t(token.descriptionKey) : '',
          website: token.website ?? '',
          twitter: token.twitter,
          discord: token.discord,
          github: token.github,
          baseAddress: token.address,
        },
      ]),
  ) as Record<TokenSymbol, TokenInfoData>;
};

export default useTokenData;
