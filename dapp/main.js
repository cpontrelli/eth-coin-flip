var web3 = new Web3(Web3.givenProvider);
var contractInstance;

$(document).ready(function() {
    window.ethereum.enable().then(function(accounts) {
        contractInstance = new web3.eth.Contract(abi, "0xD1B3d6F13293fFF5AebAe44D987AED33B8CE9caD", {from: accounts[0]});
        console.log(contractInstance);
    });

    $("#place_bet_button").click(placeBet);
    $("#add_funds_button").click(addFunds);
});

function placeBet(){
    var prediction = $("#prediction").val();
    var bet = $("#bet_input").val();

    contractInstance.methods.settleBet(prediction).send({value: bet})
        .on("transactionHash", function(hash) {
            console.log(hash);
        });
}

function addFunds() {
    var value = $("#funds_input").val();

    contractInstance.methods.addFunds().send(value)
        .on("transactionHash", function(hash) {
            console.log(hash);
        });
}
