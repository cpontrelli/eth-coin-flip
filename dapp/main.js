var web3 = new Web3(Web3.givenProvider);
var contractInstance;

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts) {
        contractInstance = new web3.eth.Contract(abi, "0x116b8E810E255CA3A099d20ef6CcB06A41ea7219", {from: accounts[0]});
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

function placeBet(){
    var prediction = $("#prediction").val();
    var bet = $("#bet_input").val() * (10 ** 18); //convert to Wei

    contractInstance.methods.settleBet(prediction).send({value: bet})
}

function addFunds() {
    var value = $("#funds_input").val();

    contractInstance.methods.addFunds().send({value})
        .on("transactionHash", function(hash) {
            console.log(hash);
        });
}
