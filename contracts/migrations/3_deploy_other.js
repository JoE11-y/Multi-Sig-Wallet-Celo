const Wallet = artifacts.require("Wallet")

// TODO testnet accounts
module.exports = function(deployer, network, accounts) {
  if (network === "main") {
    return
  }

  console.log("-----------------------------")
  console.log(accounts)
  console.log("-----------------------------")

  const owners = accounts.slice(0, 3)
  const numConfirmationsRequired = 2

  return deployer.deploy(Wallet, owners, numConfirmationsRequired)
}