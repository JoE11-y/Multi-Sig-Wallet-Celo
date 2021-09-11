import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";

// https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md
export async function unlockAccount() {
  // @ts-ignore
  const { celo } = window;

  if (!celo) {
    throw new Error("Web3 not found");
  }

  const web3 = new Web3(celo);
  await celo.enable();
  
  const kit = newKitFromWeb3(web3);

  const accounts = await kit.web3.eth.getAccounts();

  return { web3, account: accounts[0] || "" };
}

export function subscribeToAccount(
  web3: Web3,
  callback: (error: Error | null, account: string | null) => any
) {
  const id = setInterval(async () => {
    try {
      const kit = newKitFromWeb3(web3);
      const accounts = await kit.web3.eth.getAccounts();
      callback(null, accounts[0]);
    } catch (error) {
      callback(error, null);
    }
  }, 1000);

  return () => {
    clearInterval(id);
  };
}

export function subscribeToNetId(
  web3: Web3,
  callback: (error: Error | null, netId: number | null) => any
) {
  const id = setInterval(async () => {
    try {
      const kit = newKitFromWeb3(web3);
      const netId = await kit.web3.eth.net.getId();
      callback(null, netId);
    } catch (error) {
      callback(error, null);
    }
  }, 1000);

  return () => {
    clearInterval(id);
  };
}
