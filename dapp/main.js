var web3 = new Web3(Web3.givenProvider);
var address = "0x8b70812af3Ee40BDa81cCE91D5F8bF7bA0C09412";
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

        let winnings = await calcWinnings(accounts[0]);
        $("#withdraw_button").html(`Withdraw Winnings: ${winnings} ETH`);

        $("#place_bet_button").click(placeBet);
        $("#withdraw_button").click(() => withdrawWinnings(accounts[0]));

        contractInstance.events.allEvents()
            .on('data', async function(event){
                console.log(event);
                if (event.event == "flipWon" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let winningAlert = $.parseHTML(alert);
                    $(winningAlert).addClass("alert-success");
                    $(winningAlert).prepend(`<strong>Flip Won!</strong> ${event.returnValues.value/(10**18)} ETH added to your winnings.`);
                    $("#bet-alerts").prepend(winningAlert);
                    winnings = await calcWinnings(accounts[0]);
                    $("#withdraw_button").html(`Withdraw Winnings: ${winnings} ETH`);
                    setTimeout(() => $(winningAlert).alert('close'), 10000);
                } else if (event.event == "flipLost" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let losingAlert = $.parseHTML(alert);
                    $(losingAlert).addClass("alert-danger");
                    $(losingAlert).prepend("<strong>Flip Lost</strong> Thanks for playing!");
                    $("#bet-alerts").prepend(losingAlert);
                    setTimeout(() => $(losingAlert).alert('close'), 10000);
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
                    setTimeout(() => $(flippedAlert).alert('close'), 10000);
                } else if (event.event == "paidWinnings" && accounts[0].toUpperCase() == event.returnValues.player.toUpperCase()) {
                    let paidAlert = $.parseHTML(alert);
                    $(paidAlert).addClass("alert-success");
                    $(paidAlert).prepend(`<strong>${event.returnValues.value/(10**18)} ETH</strong> Transferred.`);
                    $("#bet-alerts").prepend(paidAlert);
                    winnings = await calcWinnings(accounts[0]);
                    $("#withdraw_button").html(`Withdraw Winnings: ${winnings} ETH`);
                    setTimeout(() => $(paidAlert).alert('close'), 10000);
                }
            });
    });
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

async function calcWinnings(account) {
    let winnings = 0;
    try {
        player = await contractInstance.methods.players(account).call();
        winnings = (player.winnings / (10 ** 18));
    } catch {
        winnings = 0;
    }
    return winnings;
}

async function withdrawWinnings(account) {
    let winnings = await calcWinnings(account);
    if(winnings == 0) {
        let warning = $.parseHTML(alert);
        $(warning).addClass("alert-danger");
        $(warning).prepend("<strong>No winnings available</strong>");
        $("#bet-alerts").prepend(warning);
        setTimeout(() => $(warning).alert('close'), 5000);
    } else {
        contractInstance.methods.payWinnings().send();
    }
}