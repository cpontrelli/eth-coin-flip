var web3 = new Web3(Web3.givenProvider);
var address = "0x116b8E810E255CA3A099d20ef6CcB06A41ea7219";
var contractInstance;


$(document).ready(function() {
    window.ethereum.enable().then(function(accounts) {
        contractInstance = new web3.eth.Contract(abi, address, {from: accounts[0]});
        latestBlock = web3.eth.blockNumber
        
        console.log(contractInstance);

        contractInstance.events.allEvents()
            .on('data', function(event){
                if(event.event == "flipWon") {
                    alert("Congratulations!");
                } else if (event.event == "flipLost") {
                    alert("You're a Loser!");
                }
            });
    });

    $("#place_bet_button").click(placeBet);
    $("#add_funds_button").click(addFunds);

});

async function placeBet(){
    var prediction = $("#prediction").val();
    var bet = $("#bet_input").val() * (10 ** 18); //convert to Wei
    var balance = await contractInstance.methods.balance().call();

    if(balance >= bet && bet > 0) {
        contractInstance.methods.settleBet(prediction).send({value: bet})
    } else {
        alert("Bet must be greater then 0 and less than " + balance/(10**18) + " ETH." );
    }
}

function addFunds() {
    var value = $("#funds_input").val();

    contractInstance.methods.addFunds().send({value})
        .on("transactionHash", function(hash) {
            console.log(hash);
        });
}
