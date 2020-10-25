var web3 = new Web3(Web3.givenProvider);
var address = "0x1C9d372736De512c8461a27A6b4A8E4FC25C1B50";
var contractInstance;

var alert = `<div class="alert alert-dismissible fade show" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>`

$(document).ready(function() {
    window.ethereum.enable().then(async function(accounts) {
        contractInstance = new web3.eth.Contract(abi, address, {from: accounts[0]});
        
        console.log(contractInstance);
       
        contractInstance.events.allEvents()
            .on('data', function(event){
                console.log(event);
                if(event.event == "flipWon" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let winningAlert = $.parseHTML(alert);
                    $(winningAlert).addClass("alert-success");
                    $(winningAlert).prepend(`<strong>Flip Won!</strong> ${event.returnValues.value/(10**18)} ETH added to your winnings.`);
                    $("#bet-alerts").prepend(winningAlert);
                    setTimeout(() => $(winningAlert).alert('close'), 5000);
                } else if (event.event == "flipLost" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let losingAlert = $.parseHTML(alert);
                    $(losingAlert).addClass("alert-danger");
                    $(losingAlert).prepend("<strong>Flip Lost</strong> Thanks for playing!");
                    $("#bet-alerts").prepend(losingAlert);
                    setTimeout(() => $(losingAlert).alert('close'), 5000);
                } else if (event.event == "coinFlipped" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let flippedAlert = $.parseHTML(alert);
                    $(flippedAlert).addClass("alert-primary");
                    if(event.returnValues.result == "0")
                    {
                        $(flippedAlert).prepend("<strong>Heads</strong>");
                    } else {
                        $(flippedAlert).prepend("<strong>Tails</strong>");
                    }
                    $("#bet-alerts").prepend(flippedAlert);
                    setTimeout(() => $(flippedAlert).alert('close'), 5000);
                }
            });
    });

    $("#place_bet_button").click(placeBet);

});

async function placeBet(){
    var prediction = parseInt($("#prediction").val());
    var bet = parseFloat($("#bet_input").val()) * (10 ** 18); //convert to Wei
    var balance = await contractInstance.methods.freeBalance().call();
    balance = parseFloat(balance);
    
    if((balance / 50) >= bet && bet > 0) {
        contractInstance.methods.placeBet(prediction).send({value: bet})
    } else {
        let warning = $.parseHTML(alert);
        $(warning).addClass("alert-danger");
        $(warning).prepend("Bet must be <strong>greater</strong> than 0 and <strong>less</strong> than " + (balance/(10**18))/50 + " ETH.");
        $("#bet-alerts").prepend(warning);
        setTimeout(() => $(warning).alert('close'), 5000);
    }
}
