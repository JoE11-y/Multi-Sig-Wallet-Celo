import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "@celo/connect/node_modules/bignumber.js";
// eslint-disable-next-line
import { updateTypeAliasDeclaration } from "typescript";
//import { values } from "lodash";

const ERC20_DECIMALS = 18
const erc20 = require("../contracts/IERC20Token.abi.json");
const multiSigWallet =  require( "../contracts/MultiSigWallet.abi.json");

const MWContractAddress = "0xCda53495713Fc650C438735Fe78Bb416028757D1"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"

interface Transaction {
  txIndex: number;
  to: string;
  amount: BigNumber;
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

export async function approve(web3: Web3, account: string, price: BigNumber ) {
  const kit = newKitFromWeb3(web3);

  const cUSDContract = new kit.web3.eth.Contract(erc20 as AbiItem, cUSDContractAddress);
  // eslint-disable-next-line
  const result = await cUSDContract.methods
    .approve(MWContractAddress, price)
    .send({ from: account})
  return result
}

export async function get(web3: Web3, account: string): Promise<GetResponse> {
  const kit = newKitFromWeb3(web3);

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)

  const balance = await contract.methods.getBalance().call();

  const owners = await contract.methods.getOwners().call()

  const numConfirmationsRequired = await contract.methods.getNumConfirmationsRequired().call()
 
  const transactionCount = await contract.methods.getTransactionCount().call();

  // get 10 most recent tx
  const count = transactionCount
  const transactions: Transaction[] = [];
  for (let i = 1; i <= 10; i++) {
    const txIndex = count - i;
    if (txIndex < 0) {
      break;
    }

    const tx = await contract.methods.getTransaction(txIndex).call();
    
    const isConfirmed = await contract.methods.isConfirmed(txIndex, account).call();

    transactions.push({
      txIndex,
      to: tx.to,
      amount: tx.amount,
      data: tx.data,
      executed: tx.executed,
      numConfirmations: tx.numConfirmations,
      isConfirmedByCurrentAccount: isConfirmed,
    });
  }

  return {
    address: MWContractAddress,
    balance,
    owners,
    numConfirmationsRequired: numConfirmationsRequired,
    transactionCount: count,
    transactions,
  };
}

export async function deposit(
  web3: Web3,
  account: string,
  params: {
    amount: BigNumber;
  }
) {
  const { amount } = params;

  const kit = newKitFromWeb3(web3);

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)
  
  try {
    await approve(web3, account, amount)
  } catch (error) {
    alert(`⚠️ ${error}.`)
  }
  // eslint-disable-next-line
  const result = await contract.methods
    .deposit(amount)
    .send({ from: account})
}

export async function submitTx(
  web3: Web3,
  account: string,
  params: {
    to: string;
    // NOTE: error when passing BigNumber type, so pass string
    amount: string;
    data: string;
  }
) {
  const kit = newKitFromWeb3(web3);
  const { to, amount, data } = params;

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)

  try {
    
    const _amount = new BigNumber(amount).shiftedBy(ERC20_DECIMALS)
    // eslint-disable-next-line
    const result = await contract.methods
      .submitTransaction(to, _amount, data)
      .send({ from: account })
  } catch (error) {
    alert(`⚠️ ${error}.`)
  }
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

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)

  try {
    // eslint-disable-next-line
    const result = await contract.methods
      .confirmTransaction(txIndex)
      .send({ from: account })
  } catch (error) {
    alert(`⚠️ ${error}.`)
  }
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

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)

  try {
    // eslint-disable-next-line
    const result = await contract.methods
      .revokeConfirmation(txIndex)
      .send({ from: account })
  } catch (error) {
    alert(`⚠️ ${error}.`)
  }
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

  const contract = new kit.web3.eth.Contract(multiSigWallet as AbiItem, MWContractAddress)

  try {
    // eslint-disable-next-line
    const result = await contract.methods
      .executeTransaction(txIndex)
      .send({ from: account })
  } catch (error) {
    alert(`⚠️ ${error}.`)
  }
}

export function subscribe(
  web3: Web3,
  address: string,
  callback: (error: Error | null, log: Log | null) => void
) {
  const kit = newKitFromWeb3(web3);

  const multiSig = new kit.web3.eth.Contract(multiSigWallet as AbiItem, address);

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
    amount: string;
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
