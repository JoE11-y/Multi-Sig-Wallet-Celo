# MULTI-SIGNATURE-WALLET

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

And Using [Typescript](https://www.typescriptlang.org/).

A multisig wallet is a wallet shared by two or more users called copayers. Depending on the kind of wallet, the number of signatures required to sign a transaction will be lower or equal to the number of copayers of the wallet.

On Deploy (i.e the Contract) you can set the number of users and the number of signatures required to confirm a transaction.
Only these explicitly defined users (i.e Users address) are able to carry out any transaction on the wallet.

Deposits are allowed from other wallets asides the defined users(owners).

## For Testers

After deploying contract, edit the CA in the /src/api/multi-sig-wallet.ts, then you can be able to work with the wallet.

## Install

```

npm install

```

or

```

yarn install

```

## Start

In the project directory, you can run:

```
yarn start
```

or

```
npm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

## Build

```

npm run deploy

```

## Usage

1. Install the [CeloExtensionWallet](https://chrome.google.com/webstore/detail/celoextensionwallet/kkilomkmpmkbdnfelcpgckmpcaemjcdh?hl=en) from the google chrome store.
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet in the CeloExtensionWallet.
