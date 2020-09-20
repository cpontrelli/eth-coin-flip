import "./Ownable.sol";
pragma solidity 0.5.12;

contract CoinFlip is Ownable{
    uint public balance;

    event coinFlipped(uint result);
    event flipWon(uint earnings);
    event flipLost(uint losses);
    
    modifier validateBet(){
        require(msg.value > 0 && msg.value <= balance);
        _;
    }

    function flipCoin() private view returns(uint) {
        return now % 2;
    }

    function settleBet(uint prediction) public payable validateBet returns(uint) {
        uint outcome = flipCoin();
        emit coinFlipped(outcome);
        if(outcome == prediction) {
            balance -= msg.value;
            msg.sender.transfer(msg.value * 2);
            emit flipWon(msg.value);
            return 1;
        } else {
            balance += msg.value;
            emit flipLost(msg.value);
            return 0;            
        }
    }

    function addFunds() public onlyOwner payable returns(uint) {
        require(msg.value > 0);
        balance += msg.value;
        return balance;
    }

    function withdrawAll() public onlyOwner returns(uint) {
       uint toTransfer = balance;
       balance = 0;
       msg.sender.transfer(toTransfer);
       return toTransfer;
   }

}