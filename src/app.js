const express = require("express");
const app = express();
var fs = require('fs');
const contractJson = fs.readFileSync('build/contracts/abi.json');
const AWS = require('aws-sdk');
const short = require('short-uuid');
const Web3WsProvider = require('web3-providers-ws');
const HDWalletProvider = require("truffle-hdwallet-provider");
//blockchain
require('dotenv').config()
const Web3 = require('web3');
const { ethers, utils, TransactionRequest } = require('ethers');

// const contractJson = fs.readFileSync('./tokenMintERC20MintableToken.json');
const Promise = require("bluebird");
const randomNumber = require("random-number-csprng");

//initial web3
const abi = JSON.parse(contractJson);
const connectionProvider = new Web3WsProvider(`wss://kovan.infura.io/ws/v3/${process.env.infuraProjectID}`);
const zeroExPrivateKeys = [process.env.walletPrivateKey];
const walletProvider = new HDWalletProvider(zeroExPrivateKeys, connectionProvider);
const web3 = new Web3(walletProvider);


// create instance of TokenMin
const contract = new web3.eth.Contract(abi, process.env.contractAddress);

app.use(express.urlencoded({ extended: true }))
app.use(express.json());
app.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
});

//Static Files
app.use(express.static('src'))
app.use('/css', express.static(__dirname + 'src/css'))
app.use('/css', express.static(__dirname + 'src/js'))
app.use('/css', express.static(__dirname + 'src/img'))
app.use('/css', express.static(__dirname + 'src/image'))
app.use('/css', express.static(__dirname + 'src/dist'))
app.use('/css', express.static(__dirname + 'src/fonts'))
app.set("views", "path/to/views")

//Set Views
app.set('views', './src/views/partial_view');
app.set('views', './src/views');
app.set('view engine', 'ejs');

//DBFunctions
// AWS.config.update({
//     region: process.env.AWS_DEFAULT_REGION,
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// })
const dynamoClient = new AWS.DynamoDB.DocumentClient()
const TABLE_NAME = "results"
const TABLE_NAME_OVER_ALL_RESULT = "overAllResults"
const TABLE_NAME_TOKEN_HOLDERS_RESULT = "tokenHolders"
let trueRandom = 0;

async function getResults() {
    const params = {
        TableName: TABLE_NAME,
    };
    const results = await dynamoClient.scan(params).promise();
    return results;
};

async function getresultByDate(date) {
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'date-index',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
            ":date": date
        },
    };

    const results = await dynamoClient.query(params).promise();
    return results;
};

async function addOrUpdateresult(result) {
    const params = {
        TableName: TABLE_NAME,
        Item: result,
    };
    return await dynamoClient.put(params).promise();
};

async function addOrUpdateOverAllresult(result) {
    const params = {
        TableName: TABLE_NAME_OVER_ALL_RESULT,
        Item: result,
    };
    return await dynamoClient.put(params).promise();
};
async function getOverAllResultByDate(date) {
    const params = {
        TableName: TABLE_NAME_OVER_ALL_RESULT,
        IndexName: 'date-index',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: {
            ":date": date
        },
        // Limit: 1,
        // ScanIndexForward: true,
    };
    // console.log(params)
    const results = await dynamoClient.query(params).promise();
    return results;
};

const deleteResult = async(id,count) => {
    const params = {
        TableName: TABLE_NAME,
        Key:{
             "id" : id,
             "count" : count
        },
 
    };
    return await dynamoClient.delete(params).promise();
};
async function deleteOverAllResult(id) {
    const params = {
        TableName: TABLE_NAME_OVER_ALL_RESULT,
        Key: {
            "id" : id,
        }
    };
    return await dynamoClient.delete(params).promise();
};

async function getTokenHolders() {
    const params = {
        TableName: TABLE_NAME_TOKEN_HOLDERS_RESULT,
    };
    const results = await dynamoClient.scan(params).promise();
    return results;
};
//end of db functions

//slotActions
async function airdrop(recipient, amount) {
    const [account] = await web3.eth.getAccounts();

    let airDropResult = contract.methods.getAirdrop(recipient, amount).estimateGas({ from: account })
        .then(gasAmount => {
            let airDrop = contract.methods.getAirdrop(recipient, amount)
                .send({
                    from: account,
                    gasLimit: gasAmount,
                    type: '0x2'
                })
                .then(result => {
                    return new Promise(resolve => { resolve(result) });
                })
                .catch(error => {
                    console.log(error,"ERROR")
                })
            return airDrop;
        })
        .catch(err => {
            console.log(err,"ERR")
        })
    // console.log(airDropResult, 'Air drop Result');
    return airDropResult;
}

async function burn(amount,res) {
    const [account] = await web3.eth.getAccounts();

    let burnResult = contract.methods.burn(amount)
        .send({
            from: account,
            gasLimit: 100000,
            type: '0x2'
        })
        .then(function (result) {
            return new Promise(resolve => { resolve(result) });
        })
        .catch(error => res.status(404).send(error))
    return burnResult;
}

async function mint(amount, res) {
    const toAddress = process.env.contractAddress;
    const [account] = await web3.eth.getAccounts();

    let mintResult = contract.methods.mint(toAddress, amount).estimateGas({ from: account })
        .then(gasAmount => {
            let mint = contract.methods.mint(toAddress, amount)
                .send({
                    from: account,
                    gasLimit: gasAmount,
                    type: '0x2'
                })
                .then(result => {
                    return new Promise(resolve => { resolve(result) });
                })
                .catch(error => {
                    res.status(404).send(error)
                })
            return mint;
        })
        .catch(err => {
            res.status(404).send(err)
        })

    return mintResult;
}

app.route('/airdrop').post(async (req, res) => {
    const { recipient, amount } = req.body;
    const [account] = await web3.eth.getAccounts();

    contract.methods.getAirdrop(recipient, amount).estimateGas({ from: account })
        .then(gasAmount => {
            contract.methods.getAirdrop(recipient, amount)
                .send({
                    from: account,
                    gasLimit: gasAmount,
                    type: '0x2'
                })
                .then(result => {
                    res.send(result)
                })
                .catch(error => {
                    res.status(404).send(error)
                })
        })
        .catch(err => {
            res.status(404).send(err)
        })
});

app.route('/mint').post(async (req, res) => {
    const { toAddress, amount } = req.body;
    const [account] = await web3.eth.getAccounts();

    contract.methods.mint(toAddress, amount).estimateGas({ from: account })
        .then(gasAmount => {
            contract.methods.mint(toAddress, amount)
                .send({
                    from: account,
                    gasLimit: gasAmount,
                    type: '0x2'
                })
                .then(result => {
                    res.send(result)
                })
                .catch(error => {
                    res.status(404).send(error)
                })
        })
        .catch(err => {
            res.status(404).send(err)
        })
});

app.route('/burn').post(async (req, res) => {
    const { amount } = req.body;
    const [account] = await web3.eth.getAccounts();
    contract.methods.burn(amount).estimateGas({ from: account })
        .then(gasAmount => {
            contract.methods.burn(amount)
                .send({
                    from: account,
                    gasLimit: gasAmount,
                    type: '0x2'
                })
                .then(result => {
                    res.send(result)
                })
                .catch(error => {
                    res.status(404).send(error)
                })
        })
        .catch(err => {
            res.status(404).send(err)
        })
})
//end of slot actions

app.get("/", (req, res) => {
    res.render('website')
});

function spinSlotMachine() {
    let slotResult = Promise.try(function () {
        return randomNumber(900, 1000);
    }).then(function (number) {

        let contractSpin = contract.methods.spinSlotMachine(number).call().then(function (randomValue) {

            var dateNow = Date.now();
            var today = new Date(dateNow);
            var dateFormatted = today.toDateString();
            let getResultByDate = getresultByDate(dateFormatted)
                .then(function (resultByDate) {

                    var slotActionType = [1, 2, 3];
                    var i = 0;
                    var air_drop_result = 0;
                    var burn_result = 0;
                    var mint_result = 0;
                    var actions = [];
                    var dominantAction;
                    var count = resultByDate.Items == 0 || resultByDate.Count == 7 ? 1 : resultByDate.Count + 1;
                    console.log(count);

                    const actionTypeEnum = {
                        1: "AIR_DROP",
                        2: "BURN",
                        3: "MINT"
                    }

                    let slot = { results: [{}, {}, {}] };
                    slot.results.map(result => {
                        var randomsvalue = randomValue[i] + ''.split();
                        var slotResult = randomsvalue[Math.floor(Math.random() * randomsvalue.length)]
                        var actionType = slotActionType[Math.floor(Math.random() * slotActionType.length)];

                        air_drop_result = actionType == 1 ? +air_drop_result + +slotResult : air_drop_result;
                        burn_result = actionType == 2 ? +burn_result + +slotResult : burn_result;
                        mint_result = actionType == 3 ? +mint_result + +slotResult : mint_result;

                        result.type = actionTypeEnum[`${actionType}`]; // burn mint airdop
                        result.value = slotResult;
                        i++
                        // console.log(randomsvalue,'Random Value');
                        // console.log(air_drop_result,'Air Drop');
                        // console.log(burn_result,'Burn');
                        // console.log(mint_result,'Mint');
                    });


                    actions.push(air_drop_result, burn_result, mint_result);
                    dominantAction = +findDominantAction(actions) + +1;
                    slot.id = short.generate();
                    // console.log(resultByDate.Count);
                    slot.count = count;
                    slot.airdrop = air_drop_result;
                    slot.burn = burn_result;
                    slot.mint = mint_result;
                    slot.dominant = actionTypeEnum[dominantAction];
                    slot.value = dominantAction == 1 ? air_drop_result : dominantAction == 2 ? burn_result : mint_result;
                    slot.date = dateFormatted;

                    return new Promise(resolve => { resolve(slot) });


                })

            return getResultByDate;
        })
        return contractSpin;
    })
    return slotResult;
}

app.get('/slotMachinResult', async (req, res) => {

    let slotResults = await spinSlotMachine()
    // console.log(slotResults);
    //insert slot result
    let insert = await addOrUpdateresult(slotResults)

    //check day if 7 days 
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();

    let getAllResultsByDate = await getresultByDate(dateFormatted)

    if (getAllResultsByDate.Count == 7) {
        var air_drop_result = 0;
        var burn_result = 0;
        var mint_result = 0;
        var actions = [];
        var dominantAction;
        const actionTypeEnum = {
            AIR_DROP: 1,
            BURN: 2,
            MINT: 3
        }
        const valueEnum = {
            AIR_DROP: air_drop_result,
            BURN: burn_result,
            MINT: mint_result
        }

        getAllResultsByDate.Items.forEach(Items => {
            Items.results.forEach(result => {
                air_drop_result = actionTypeEnum[result.type] == 1 ? +air_drop_result + +result.value : air_drop_result;
                burn_result = actionTypeEnum[result.type] == 2 ? +burn_result + +result.value : burn_result;
                mint_result = actionTypeEnum[result.type] == 3 ? +mint_result + +result.value : mint_result;

            });
        });

        actions.push(air_drop_result, burn_result, mint_result);
        dominantAction = +findDominantAction(actions) + +1;

        let slotOverAllResult = {};

        slotOverAllResult.id = short.generate();
        slotOverAllResult.dominantAction = dominantAction;
        slotOverAllResult.date = dateFormatted;
        slotResults.overAll = slotOverAllResult;

        await addOrUpdateOverAllresult(slotOverAllResult)
    }

    res.json(slotResults)

});
app.get('/resetData', async (req, res) => {
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();
    let getResultToday =  await getresultByDate(dateFormatted)
    let getOverAllResultsByDate = await getOverAllResultByDate(dateFormatted)
    getResultToday.Items.forEach(async (item) => {
        console.log(item.id,'ID')
        await deleteResult(item.id,item.count);
       
    });
    console.log(getOverAllResultsByDate.Items[0]['id']);
    await deleteOverAllResult(getOverAllResultsByDate.Items[0]['id']);

})

app.post('/rouletteAction', async (req, res) => {
    
    // console.log(getTokenHoldersResult);
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();
    let getDominantResultsByDate = await getOverAllResultByDate(dateFormatted)
    // console.log(getDominantResultsByDate);
    var dominantActionType = getDominantResultsByDate.Items[0].dominantAction;
    // var dominantActionType = 1;
    var rouletteResultJSON = JSON.parse(Object.keys(req.body));
    var roulleteResult = rouletteResultJSON['rouletteResult'];
    let initialSupply = await contract.methods.totalSupply().call();
    var initialAmount = roulleteResult * initialSupply;
    var amount = Math.floor(initialAmount);
    console.log(initialSupply, "Initial Supply");
    console.log(amount, "Amount");
    
    if (dominantActionType == 1) {
        let getTokenHoldersResults = await getTokenHolders();
        getTokenHoldersResults.Items.forEach(async (item) => {
            let airdropReceipt = await airdrop(item.walletAddress, amount);
            console.log(airdropReceipt, "Airdrop Receipt");
            // console.log(item);
        });

    } else if (dominantActionType == 2) {
        let burnReceipt = await burn(amount,res);
        console.log(burnReceipt, "Burn Receipt");
        res.json(burnReceipt);

    } else {
        let mintReceipt = await mint(amount, res);
        console.log(mintReceipt, "Mint Receipt");
        res.json(mintReceipt);
    }
    let totalSupply = await contract.methods.totalSupply().call();
    console.log(totalSupply, "Total Supply");

});
app.get('/checkDay', async (req, res) => {

    //check day if 7 days 
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();

    let getOverAllResultsByDate = await getOverAllResultByDate(dateFormatted)
    console.log(getOverAllResultsByDate);
    res.json(getOverAllResultsByDate)

});
function findDominantAction(numericValues) {
    var max = -Infinity; // calling Math.max with no arguments returns -Infinity
    var maxName = null;
    for (var key in numericValues) {
        var num = numericValues[key];

        if (num > max) {
            max = num;
            maxName = key;
        }

        max = (num > max && num) || max;
    }

    return maxName;
}