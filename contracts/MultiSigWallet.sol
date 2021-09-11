// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract MultiSigWallet {
    //Variables
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    address[] public owners;

    mapping(address => bool) public isOwner;

    uint256 public numConfirmationsRequired;

    address public walletAddr;

    uint256 public walletBalance;

    struct Transaction {
        address to;
        uint256 amount;
        string purpose;
        bool executed;
        uint256 numConfirmations;
        mapping(address => bool) isConfirmed;
    }

    Transaction[] public transactions;

    //Events
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event Withdrawal(address indexed sender, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 amount,
        string purpose
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);

    //Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(
            !transactions[_txIndex].isConfirmed[msg.sender],
            "tx already confirmed"
        );
        _;
    }

    modifier enoughBal(uint256 _amount) {
        _;
    }

    //Constructor
    constructor(address[] memory _owners, uint256 _numConfirmationsRequired) {
        require(
            _numConfirmationsRequired > 0 &&
                _numConfirmationsRequired <= _owners.length,
            "invalid number of required confirmations"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];

            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");

            isOwner[owner] = true;
            owners.push(owner);
        }

        numConfirmationsRequired = _numConfirmationsRequired;
        walletAddr = address(this);
    }

    //Functions
    function deposit(uint256 _amount) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "Transfer failed"
        );

        emit Deposit(
            msg.sender,
            _amount,
            IERC20Token(cUsdTokenAddress).balanceOf(address(this))
        );
    }

    function getBalance() public view returns (uint256) {
        uint256 balance = IERC20Token(cUsdTokenAddress).balanceOf(
            address(this)
        );
        return balance;
    }

    function submitTransaction(
        address _to,
        uint256 _value,
        string memory _purpose
    ) public onlyOwner {
        uint256 txIndex = transactions.length;
        transactions.push();
        Transaction storage _transaction = transactions[txIndex];
        _transaction.to = _to;
        _transaction.amount = _value;
        _transaction.purpose = _purpose;
        _transaction.executed = false;
        _transaction.numConfirmations = 0;

        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _purpose);
    }

    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        Transaction storage _transaction = transactions[_txIndex];

        _transaction.isConfirmed[msg.sender] = true;
        _transaction.numConfirmations += 1;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "cannot execute tx"
        );

        address _to = transaction.to;
        uint256 _amount = transaction.amount;

        require(
            IERC20Token(cUsdTokenAddress).balanceOf(address(this)) >= _amount,
            "Not Enough Balance"
        );

        require(
            IERC20Token(cUsdTokenAddress).transfer(_to, _amount),
            "tx failed"
        );

        transaction.executed = true;

        emit ExecuteTransaction(msg.sender, _txIndex);
        emit Withdrawal(
            msg.sender,
            IERC20Token(cUsdTokenAddress).balanceOf(address(this))
        );
    }

    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.isConfirmed[msg.sender], "tx not confirmed");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 amount,
            string memory purpose,
            bool executed,
            uint256 numConfirmations
        )
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.amount,
            transaction.purpose,
            transaction.executed,
            transaction.numConfirmations
        );
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getNumConfirmationsRequired() public view returns (uint256) {
        return numConfirmationsRequired;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function isConfirmed(uint256 _txIndex, address _owner)
        public
        view
        returns (bool)
    {
        Transaction storage transaction = transactions[_txIndex];

        return transaction.isConfirmed[_owner];
    }
}
