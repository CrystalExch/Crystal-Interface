import { AlchemyAccountsUIConfig, createConfig } from "@account-kit/react";
import { alchemy } from "@account-kit/infra";
import { QueryClient } from "@tanstack/react-query";
import { settings } from "./settings";

const uiConfig: AlchemyAccountsUIConfig = {
  illustrationStyle: "outline",
  auth: {
    sections: [[{"type":"email","emailMode":"otp"}],[{"type":"passkey"},{"type":"social","authProviderId":"google","mode":"popup"},{"type":"social","authProviderId":"auth0","mode":"popup","auth0Connection":"discord","displayName":"Discord","logoUrl":"/images/discord.svg","scope":"openid profile"},{"type":"social","authProviderId":"auth0","mode":"popup","auth0Connection":"twitter","displayName":"Twitter","logoUrl":"/images/twitter.svg","logoUrlDark":"/images/twitter-dark.svg","scope":"openid profile"}],[{"type":"external_wallets","walletConnect":{"projectId":"your-project-id"}}]],
    addPasskeyOnSignup: false,
  },
  supportUrl: "https://discord.gg/CrystalExch"
};

export const alchemyconfig = createConfig({
  // if you don't want to leak api keys, you can proxy to a backend and set the rpcUrl instead here
  // get this from the app config you create at https://dashboard.alchemy.com/accounts?utm_source=demo_alchemy_com&utm_medium=referral&utm_campaign=demo_to_dashboard
  transport: alchemy({ apiKey: "SqJPlMJRSODWXbVjwNyzt6-uY9RMFGng" }),
  chain: settings.chains[0],
  ssr: false, // set to false if you're not using server-side rendering
  enablePopupOauth: true,
}, uiConfig);

export const queryClient = new QueryClient();