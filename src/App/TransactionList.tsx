import React from "react";
import BigNumber from "web3-core/node_modules/bignumber.js";
import TransactionActions from "./TransactionActions";
const ERC20_DECIMALS = 18
interface Transaction {
  txIndex: number;
  to: string;
  amount: BigNumber;
  purpose: string;
  executed: boolean;
  numConfirmations: number;
  isConfirmedByCurrentAccount: boolean;
}

interface Props {
  numConfirmationsRequired: number;
  count: number;
  data: Transaction[];
}

const TransactionList: React.FC<Props> = ({
  numConfirmationsRequired,
  count,
  data
}) => {
  return (
    <ul>
      {data.map(tx => ( 
        <li key={tx.txIndex} style={{paddingBottom: "15px"}}>
          <div>To: {tx.to}</div>
          <div>Amount: {new BigNumber(tx.amount).shiftedBy(-ERC20_DECIMALS).toString()} cUSD</div>
          <div>Purpose: {tx.purpose}</div>
          <div>Executed: {tx.executed.toString()}</div>
          <div>Confirmations: {tx.numConfirmations}</div>
          <TransactionActions
            numConfirmationsRequired={numConfirmationsRequired}
            tx={tx}
          />
        </li>
      ))}
    </ul>
  );
};

export default TransactionList;
