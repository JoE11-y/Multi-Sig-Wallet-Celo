import Web3 from "web3";
//import BN from "bn.js";
import { newKitFromWeb3 } from "@celo/contractkit";
import * as TruffleContract from "@truffle/contract";
import BigNumber from "@celo/connect/node_modules/bignumber.js";
import multiSigWallet from "../../contracts/build/contracts/MultiSigWallet.json"
import erc20 from "../../contracts/build/contracts/IERC20Token.json"
import BN from "bn.js";
import { updateTypeAliasDeclaration } from "typescript";
//import { values } from "lodash";

const ERC20_DECIMALS = 18
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

// @ts-ignore
const MultiSigWallet = TruffleContract(multiSigWallet);
// @ts-ignore
const ERC20 = TruffleContract(erc20);

interface Transaction {
  txIndex: number;
  to: string;
  value: BN;
  data: string;
  executed: boolean;
  numConfirmations: number;
  isConfirmedByCurrentAccount: boolean;
}

interface GetResponse {
  address: string;
  balance: string;
  owners: string[];
  numConfirmationsRequired: number;
  transactionCount: number;
  transactions: Transaction[];
}

async function approve(web3: Web3, account: string, price: BigNumber ) {
  const kit = newKitFromWeb3(web3);
  const cUSDContract = new kit.web3.eth.Contract(ERC20.abi, cUSDContractAddress)
  MultiSigWallet.setProvider(kit.web3.currentProvider);
  const multiSig = await MultiSigWallet.deployed();
  const result = await cUSDContract.methods
    .approve(multiSig.address, price)
    .send({ from: account})
  return result
}

export async function get(web3: Web3, account: string): Promise<GetResponse> {
  const kit = newKitFromWeb3(web3);

  MultiSigWallet.setProvider(kit.web3.currentProvider);

  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  const stabletoken = await kit.contracts.getStableToken();

  const cUSDBalance = await stabletoken.balanceOf(multiSig.address);

  const balance = cUSDBalance.shiftedBy(-ERC20_DECIMALS).toFixed(2)

  // const owners = await contract.methods.getOwners().call()
  const owners = await multiSig.getOwners();

  // const numConfirmationsRequired = await contract.methods.getNumConfirmationsRequired().call()
  const numConfirmationsRequired = await multiSig.numConfirmationsRequired();
  
  // const transactionCount = await contract.methods.getTransactionCount().call();
  const transactionCount = await multiSig.getTransactionCount();

  // get 10 most recent tx
  const count = transactionCount.toNumber();
  const transactions: Transaction[] = [];
  for (let i = 1; i <= 10; i++) {
    const txIndex = count - i;
    if (txIndex < 0) {
      break;
    }

    // const tx = await contract.methods.getTransaction(txIndex).call();
    const tx = await multiSig.getTransaction(txIndex);
    
    //const isConfirmed = await contract.methods.isConfirmed(txIndex, account).call();
    const isConfirmed = await multiSig.isConfirmed(txIndex, account);

    transactions.push({
      txIndex,
      to: tx.to,
      value: tx.value,
      data: tx.data,
      executed: tx.executed,
      numConfirmations: tx.numConfirmations.toNumber(),
      isConfirmedByCurrentAccount: isConfirmed,
    });
  }

  return {
    address: multiSig.address,
    balance,
    owners,
    numConfirmationsRequired: numConfirmationsRequired.toNumber(),
    transactionCount: count,
    transactions,
  };
}

export async function deposit(
  web3: Web3,
  account: string,
  params: {
    value: BigNumber;
  }
) {
  const { value } = params;

  const kit = newKitFromWeb3(web3);
  MultiSigWallet.setProvider(kit.web3.currentProvider);

  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  // try {
  //   await approve(web3, account, value)
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }
  // alert(`⌛ Awaiting payment for "$.name}"...`)
  // try {
  //   const result = await contract.methods
  //     .deposit
  //     .send({ from: account})
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }

  await multiSig.deposit(value, { from: account});
}

export async function submitTx(
  web3: Web3,
  account: string,
  params: {
    to: string;
    // NOTE: error when passing BigNumber type, so pass string
    value: string;
    data: string;
  }
) {
  const kit = newKitFromWeb3(web3);
  const { to, value, data } = params;
  MultiSigWallet.setProvider(kit.web3.currentProvider);
  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  // try {
  //   const result = await contract.methods
  //     .submitTransaction(to, value, data)
  //     .send({ from: account })
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }
  await multiSig.submitTransaction(to, value, data, {
    from: account,
  });
}

export async function confirmTx(
  web3: Web3,
  account: string,
  params: {
    txIndex: number;
  }
) {
  const kit = newKitFromWeb3(web3);
  const { txIndex } = params;
  MultiSigWallet.setProvider(kit.web3.currentProvider);
  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  // try {
  //   const result = await contract.methods
  //     .confirmTransaction(txIndex)
  //     .send({ from: account })
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }

  await multiSig.confirmTransaction(txIndex, {
    from: account,
  });
}

export async function revokeConfirmation(
  web3: Web3,
  account: string,
  params: {
    txIndex: number;
  }
) {
  const kit = newKitFromWeb3(web3);
  const { txIndex } = params;
  MultiSigWallet.setProvider(kit.web3.currentProvider);
  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  // try {
  //   const result = await contract.methods
  //     .revokeConfirmation(txIndex)
  //     .send({ from: account })
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }

  await multiSig.revokeConfirmation(txIndex, {
    from: account,
  });
}

export async function executeTx(
  web3: Web3,
  account: string,
  params: {
    txIndex: number;
  }
) {
  const kit = newKitFromWeb3(web3);
  const { txIndex } = params;

  MultiSigWallet.setProvider(kit.web3.currentProvider);
  const multiSig = await MultiSigWallet.deployed();

  // const contract = new kit.web3.eth.Contract(MultiSigWallet.abi, multiSig.address)

  // try {
  //   const result = await contract.methods
  //     .executeConfirmation(txIndex)
  //     .send({ from: account })
  // } catch (error) {
  //   alert(`⚠️ ${error}.`)
  // }


  await multiSig.executeTransaction(txIndex, {
    from: account,
  });
}

export function subscribe(
  web3: Web3,
  address: string,
  callback: (error: Error | null, log: Log | null) => void
) {
  const kit = newKitFromWeb3(web3);

  const multiSig = new kit.web3.eth.Contract(MultiSigWallet.abi, address);

  const res = multiSig.events.allEvents((error: Error, log: Log) => {
    if (error) {
      callback(error, null);
    } else if (log) {
      callback(null, log);
    }
  });

  return () => res.unsubscribe();
}

interface Deposit {
  event: "Deposit";
  returnValues: {
    sender: string;
    amount: string;
    balance: string;
  };
}

interface SubmitTransaction {
  event: "SubmitTransaction";
  returnValues: {
    owner: string;
    txIndex: string;
    to: string;
    value: string;
    data: string;
  };
}

interface ConfirmTransaction {
  event: "ConfirmTransaction";
  returnValues: {
    owner: string;
    txIndex: string;
  };
}

interface RevokeConfirmation {
  event: "RevokeConfirmation";
  returnValues: {
    owner: string;
    txIndex: string;
  };
}


interface ExecuteTransaction {
  event: "ExecuteTransaction";
  returnValues: {
    owner: string;
    txIndex: string;
  };
}

type Log =
  | Deposit
  | SubmitTransaction
  | ConfirmTransaction
  | RevokeConfirmation
  | ExecuteTransaction;
