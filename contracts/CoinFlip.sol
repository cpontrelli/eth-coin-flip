import "./Ownable.sol";
import "./ProvableApi.sol";
pragma solidity 0.5.12;

contract CoinFlip is Ownable, usingProvable{
    uint public freeBalance;                            //balance not reserved for bet settlement
    uint public lockedBalance;                          //balance reserved for bet settlement
    uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;    //bytes requested from oracle
    
    event coinFlipped(address player, uint result);
    event flipWon(address player, uint value);
    event flipLost(address player, uint value);
    event paidWinnings(address player, uint value);

    struct Player {
        uint winnings;
        bool initialized;
    }

    struct Bet {
        address walletAddress;
        uint prediction;
        uint value;
    }

    mapping(address => Player) public players;
    mapping(bytes32 => Bet) public bets;


    modifier validateBet(uint prediction){
        require(msg.value > 0 && msg.value <= (freeBalance / 50));
        require(prediction == 0 || prediction == 1);
        _;
    }

    function __callback(bytes32 _queryId, string memory _result, bytes memory _proof) public {
        require(msg.sender == provable_cbAddress());

        //determine result of the flip
        uint flip = uint256(keccak256(abi.encodePacked(_result))) % 2;
        emit coinFlipped(bets[_queryId].walletAddress, flip);
        
        //settle the bet by either adjusting the player's winnings or contract balances
        if(bets[_queryId].prediction == flip) {
            emit flipWon(bets[_queryId].walletAddress, bets[_queryId].value);
            players[bets[_queryId].walletAddress].winnings += bets[_queryId].value * 2;

        } else {
            emit flipLost(bets[_queryId].walletAddress, bets[_queryId].value);
            freeBalance += bets[_queryId].value * 2;
            lockedBalance -= bets[_queryId].value * 2;
        }

        //delete bet from mapping
        delete(bets[_queryId]);
    }

    function placeBet(uint prediction) public payable validateBet(prediction) {
        uint256 QUERY_EXECUTION_DELAY = 0;
        uint GAS_FOR_CALLBACK = 600000;
        bytes32 queryId = provable_newRandomDSQuery(
            QUERY_EXECUTION_DELAY, 
            NUM_RANDOM_BYTES_REQUESTED, 
            GAS_FOR_CALLBACK
        );

        Bet memory newBet = Bet(msg.sender, prediction, msg.value);
        bets[queryId] = newBet;
        freeBalance -= msg.value;
        freeBalance -= GAS_FOR_CALLBACK;
        lockedBalance += msg.value * 2;

        //if this is a new player add them to the players mapping
        if(!players[msg.sender].initialized){
            Player memory newPlayer = Player(0, true);
            players[msg.sender] = newPlayer;
        }  
    }

    function payWinnings() public returns(uint) {
        require(players[msg.sender].winnings > 0);

        uint toTransfer = players[msg.sender].winnings;
        lockedBalance -= toTransfer;
        players[msg.sender].winnings = 0;
        msg.sender.transfer(toTransfer);
        emit paidWinnings(msg.sender, toTransfer);
        return toTransfer;
    }

    function addFunds() public onlyOwner payable returns(uint) {
        require(msg.value > 0);
        freeBalance += msg.value;
        return freeBalance;
    }

    function withdrawAll() public onlyOwner returns(uint) {
       uint toTransfer = freeBalance;
       freeBalance = 0;
       msg.sender.transfer(toTransfer);
       return toTransfer;
   }

}