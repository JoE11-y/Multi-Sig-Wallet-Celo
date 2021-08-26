import React from "react";

interface Props {
  netId: number;
}

function getNetwork(netId: number) {
  switch (netId) {
    case 42220:
      return "Celo Main Network";
    case 44787:
      return "Alfajores Test Network";
    case 62320:
      return "Bavlaka Test Network";
    case 5777:
      return "Dev Network";
    default:
      return "Unkown network";
  }
}

const Network: React.FC<Props> = ({ netId }) => {
  return <div>{getNetwork(netId)}</div>;
};

export default Network;
