import { AlchemyAccountsUIConfig, createConfig } from "@account-kit/react";
import { alchemy } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { settings } from "./settings";

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [[{"type":"email","emailMode":"otp"}],[{"type":"passkey"},{"type":"social","authProviderId":"google","mode":"popup"},{"type":"social","authProviderId":"auth0","mode":"popup","auth0Connection":"discord","displayName":"Discord","logoUrl":"/images/discord.svg","scope":"openid profile"},{"type":"social","authProviderId":"auth0","mode":"popup","auth0Connection":"twitter","displayName":"Twitter","logoUrl":"/images/twitter.svg","logoUrlDark":"/images/twitter-dark.svg","scope":"openid profile"}],[{"type":"external_wallets","walletConnect":{"projectId":"0597989b7e463d2a373445b8fe44d4a3"}}]],
    addPasskeyOnSignup: false,
  },
  supportUrl: "https://discord.gg/CrystalExch"
};

export const alchemyconfig = createConfig({
  transport: alchemy({ apiKey: "SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng" }),
  chain: settings.chains[0],
  ssr: false,
  enablePopupOauth: true,
}, uiConfig);

export const queryClient = new QueryClient();