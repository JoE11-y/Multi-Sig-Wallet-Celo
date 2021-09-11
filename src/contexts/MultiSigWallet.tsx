import Web3 from "web3";
import React, {
  useReducer,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useWeb3Context } from "./Web3";
import { get as getMultiSigWallet, subscribe } from "../api/multi-sig-wallet";
import BigNumber from "bignumber.js";
//const ERC20_DECIMALS = 18

interface State {
  address: string;
  balance: string;
  owners: string[];
  numConfirmationsRequired: number;
  transactionCount: number;
  transactions: Transaction[];
}

interface Transaction {
  txIndex: number;
  to: string;
  amount: BigNumber;
  purpose: string;
  executed: boolean;
  numConfirmations: number;
  isConfirmedByCurrentAccount: boolean;
}

const INITIAL_STATE: State = {
  address: "",
  balance: "0",
  owners: [],
  numConfirmationsRequired: 0,
  transactionCount: 0,
  transactions: [],
};

const SET = "SET";
const UPDATE_BALANCE = "UPDATE_BALANCE";
const ADD_TX = "ADD_TX";
const UPDATE_TX = "UPDATE_TX";
const UPDATE_BALANCE_WITHDRAW = "UPDATE_BALANCE_WITHDRAW";

interface Set {
  type: "SET";
  data: {
    address: string;
    balance: string;
    owners: string[];
    numConfirmationsRequired: number;
    transactionCount: number;
    transactions: Transaction[];
  };
}

interface UpdateBalance {
  type: "UPDATE_BALANCE";
  data: {
    balance: string;
  };
}

interface AddTx {
  type: "ADD_TX";
  data: {
    txIndex: string;
    to: string;
    amount: string;
    purpose: string;
  };
}

interface UpdateTx {
  type: "UPDATE_TX";
  data: {
    account: string;
    txIndex: string;
    owner: string;
    executed?: boolean;
    confirmed?: boolean;
  };
}

interface UpdateBalanceWithdraw {
  type: "UPDATE_BALANCE_WITHDRAW";
  data: {
    balance: string;
  }
}

type Action = Set | UpdateBalance | AddTx | UpdateTx | UpdateBalanceWithdraw;

function reducer(state: State = INITIAL_STATE, action: Action) {
  switch (action.type) { 
    case SET: {
      return {
        ...state,
        ...action.data,
      };
    }
    case UPDATE_BALANCE: {
      return {
        ...state,
        balance: action.data.balance,
      };
    }
    case ADD_TX: {
      const {
        data: { txIndex, to, amount, purpose },
      } = action;
      const transactions = [
        {
          txIndex: parseInt(txIndex),
          to,
          amount: new BigNumber(amount),
          purpose,
          executed: false,
          numConfirmations: 0,
          isConfirmedByCurrentAccount: false,
        },
        ...state.transactions,
      ];
      return {
        ...state,
        transactionCount: Number(state.transactionCount) + 1,
        transactions,
      };
    }
    case UPDATE_TX: {
      const { data } = action;

      const txIndex = parseInt(data.txIndex);

      const transactions = state.transactions.map((tx) => {
        if (tx.txIndex === txIndex) {
          const updatedTx = {
            ...tx,
          };

          if (data.executed) {
            updatedTx.executed = true;
          }
          if (data.confirmed !== undefined) {
            if (data.confirmed) {
              updatedTx.numConfirmations = Number(updatedTx.numConfirmations) + 1;
              updatedTx.isConfirmedByCurrentAccount =
                data.owner === data.account;
            } else {
              updatedTx.numConfirmations = Number(updatedTx.numConfirmations) - 1;
              if (data.owner === data.account) {
                updatedTx.isConfirmedByCurrentAccount = false;
              }
            }
          }

          return updatedTx;
        }
        return tx;
      });

      return {
        ...state,
        transactions,
      };
    }
    case UPDATE_BALANCE_WITHDRAW: {
      return {
        ...state,
        balance: action.data.balance,
      };
    }
    default:
      return state;
  }
}

interface SetInputs {
  address: string;
  balance: string;
  owners: string[];
  numConfirmationsRequired: number;
  transactionCount: number;
  transactions: Transaction[];
}

interface UpdateBalanceInputs {
  balance: string;
}

interface AddTxInputs {
  txIndex: string;
  to: string;
  amount: string;
  purpose: string;
}

interface UpdateTxInputs {
  account: string;
  txIndex: string;
  owner: string;
  confirmed?: boolean;
  executed?: boolean;
}

interface UpdateBalanceWithdrawInputs {
  balance: string;
}

const MultiSigWalletContext = createContext({
  state: INITIAL_STATE,
  set: (_data: SetInputs) => {},
  updateBalance: (_data: UpdateBalanceInputs) => {},
  addTx: (_data: AddTxInputs) => {},
  updateTx: (_data: UpdateTxInputs) => {},
  updateBalanceWithdraw: (_data: UpdateBalanceWithdrawInputs) => {},
});

export function useMultiSigWalletContext() {
  return useContext(MultiSigWalletContext);
}

interface ProviderProps {}

export const Provider: React.FC<ProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  function set(data: SetInputs) {
    dispatch({
      type: SET,
      data,
    });
  }

  function updateBalance(data: UpdateBalanceInputs) {
    dispatch({
      type: UPDATE_BALANCE,
      data,
    });
  }

  function addTx(data: AddTxInputs) {
    dispatch({
      type: ADD_TX,
      data,
    });
  }

  function updateTx(data: UpdateTxInputs) {
    dispatch({
      type: UPDATE_TX,
      data,
    });
  }
  function updateBalanceWithdraw(data: UpdateBalanceWithdrawInputs) {
    dispatch({
      type: UPDATE_BALANCE,
      data,
    });
  }

  return (
    <MultiSigWalletContext.Provider
      value={useMemo(
        () => ({
          state,
          set,
          updateBalance,
          addTx,
          updateTx,
          updateBalanceWithdraw,
        }),
        [state]
      )}
    >
      {children}
    </MultiSigWalletContext.Provider>
  );
};

export function Updater() {
  const {
    state: { web3, account },
  } = useWeb3Context();
  const {
    state,
    set,
    updateBalance,
    addTx,
    updateTx,
    updateBalanceWithdraw,
  } = useMultiSigWalletContext();

  useEffect(() => {
    async function get(web3: Web3, account: string) {
      try {
        const data = await getMultiSigWallet(web3, account);
        set(data);
      } catch (error) {
        console.error(error);
      }
    }

    if (web3) {
      get(web3, account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3]);

  useEffect(() => {
    if (web3 && state.address) {
      return subscribe(web3, state.address, (error, log) => {
        if (error) {
          console.error(error);
        } else if (log) {
          switch (log.event) {
            case "Deposit":
              updateBalance(log.returnValues);
              break;
            case "SubmitTransaction":
              addTx(log.returnValues);
              break;
            case "ConfirmTransaction":
              updateTx({
                ...log.returnValues,
                confirmed: true,
                account,
              });
              break;
            case "RevokeConfirmation":
              updateTx({
                ...log.returnValues,
                confirmed: false,
                account,
              });
              break;
            case "ExecuteTransaction":
              updateTx({
                ...log.returnValues,
                executed: true,
                account,
              });
              break;
            case "Withdrawal":
              updateBalanceWithdraw(log.returnValues);
              break;
            default:
              console.log(log);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [web3, state.address]);
  return null;
}
