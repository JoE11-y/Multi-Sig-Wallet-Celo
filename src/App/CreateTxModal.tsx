import React, { useState } from "react";
import { Button, Modal, Form, Message } from "semantic-ui-react";
import useAsync from "../components/useAsync";
import { useWeb3Context } from "../contexts/Web3";
import { submitTx } from "../api/multi-sig-wallet";

interface Props {
  open: boolean;
  onClose: (event?: any) => void;
}

interface SubmitTxParams {
  to: string;
  amount: string;
  purpose: string;
}

const CreateTxModal: React.FC<Props> = ({ open, onClose }) => {
  const {
    state: { web3, account },
  } = useWeb3Context();

  const { pending, error, call } = useAsync<SubmitTxParams, any>(
    async (params) => {
      if (!web3) {
        throw new Error("No web3");
      }

      await submitTx(web3, account, params);
    }
  );

  const [inputs, setInputs] = useState({
    to: "",
    amount: 0,
    purpose: "",
  });

  function onChange(name: string, e: React.ChangeEvent<HTMLInputElement>) {
    setInputs({
      ...inputs,
      [name]: e.target.value,
    });
  }

  async function onSubmit() {
    if (pending) {
      return;
    }
    
    const { error } = await call({
      ...inputs,
      amount: inputs.amount.toString(),
    });

    if (!error) {
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <Modal.Header>Create Transaction</Modal.Header>
      <Modal.Content>
        {error && <Message error>{error.message}</Message>}
        <Form onSubmit={onSubmit}>
          <Form.Field>
            <label>To</label>
            <Form.Input
              type="text"
              value={inputs.to}
              onChange={(e) => onChange("to", e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Amount</label>
            <Form.Input
              type="number"
              min={0}
              value={inputs.amount}
              onChange={(e) => onChange("amount", e)}
            />
          </Form.Field>
          <Form.Field>
            <label>Purpose</label>
            <Form.Input
              type="text"
              value={inputs.purpose}
              onChange={(e) => onChange("purpose", e)}
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          color="green"
          onClick={onSubmit}
          disabled={pending}
          loading={pending}
        >
          Create
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default CreateTxModal;
