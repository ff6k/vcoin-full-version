const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: true }))
// Process application/json
app.use(express.json());

app.listen(3000, () => {
    console.log("Application started and Listening on port 3000");
});

const AWS = require('aws-sdk');
const short = require('short-uuid');

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

var Promise = require("bluebird");
var randomNumber = require("random-number-csprng");
let trueRandom = 0;

//blockchain
require('dotenv').config()
const Web3 = require('web3');
const { ethers, utils, TransactionRequest } = require('ethers');
const abi = require('./TokenMintERC20MintableToken.json');
const { json } = require("express");

//db functions
// import { getResults,addOrUpdateresult } from './DBfunctions/dbFunctions'; 

const web3 = new Web3(process.env.INFURA_KOVAN)
const provider = ethers.getDefaultProvider('kovan', {
    infura: process.env.INFURA_KOVAN
})

//Local host Ganache
const jsonprovider = new ethers.providers.JsonRpcProvider(`http://127.0.0.1:7545`);
const ganachePK = `e4a7aa9fca5bf0012fcc7add7857521e5e46239d5904e6b62d8c8ed53c91155b`;
const ganacheSigner = jsonprovider.getSigner();

//DBFunctions
AWS.config.update({
    region: process.env.AWS_DEFAULT_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
})

const dynamoClient = new AWS.DynamoDB.DocumentClient()
const TABLE_NAME = "results"
const TABLE_NAME_OVER_ALL_RESULT = "overAllResults"

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

async function deleteResultByDate(date) {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            date,
        }
    };
    return await dynamoClient.delete(params).promise();
};
async function deleteOverAllResultByDate(date) {
    const params = {
        TableName: TABLE_NAME_OVER_ALL_RESULT,
        Key: {
            date,
        }
    };
    return await dynamoClient.delete(params).promise();
};
//end of db functions

//slotActions
async function burn(amount) {
    const [account] = await web3.eth.getAccounts();

    contract.methods.burn(amount)
        .send({
            from: account,
            gasLimit: 100000,
            type: '0x2'
        })
        .then(result => res.send(result))
        .catch(error => res.status(404).send(error))
     
}

async function mint(amount) {
    // const { toAddress, amount } = req.body;
    const [account] = await web3.eth.getAccounts();

    contract.methods.mint(toAddress, amount)
        .send({
            from: account,
            gasLimit: 100000,
            type: '0x2'
        })
        .then(result => res.send(result))
        .catch(error => res.status(404).send(error))
}

app.route('/mint').post(async (req, res) => {
    const { toAddress, amount } = req.body;
    const [account] = await web3.eth.getAccounts();

    contract.methods.mint(toAddress, amount)
        .send({
            from: account,
            gasLimit: 100000,
            type: '0x2'
        })
        .then(result => res.send(result))
        .catch(error => res.status(404).send(error))
});

app.route('/burn').post(async (req, res) => {
    const { amount } = req.body;
    const [account] = await web3.eth.getAccounts();

    contract.methods.burn(amount)
        .send({
            from: account,
            gasLimit: 100000,
            type: '0x2'
        })
        .then(result => res.send(result))
        .catch(error => res.status(404).send(error))
})


//end of slot actions


// create instance of TokenMin
let contract = new ethers.Contract("0xfA1212ED02BC2A80Ee75308F1B9E4C5331A603c6", abi, jsonprovider)
contract.balanceOf("0x87866776335420031F166bB2f670BFa1B29ecC17")
    .then(function (bal) {
        console.log(`BalanceOf ${bal}`)
    });

app.get("/", (req, res) => {
    res.render('website')
});

function spinSlotMachine() {
    let slotResult = Promise.try(function () {
        return randomNumber(900, 1000);
    }).then(function (number) {

        let contractSpin = contract.spinSlotMachine(number).then(function (results) {
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
                        var randomsvalue = results[i] + ''.split();
                        var slotResult = randomsvalue[Math.floor(Math.random() * randomsvalue.length)]
                        var actionType = slotActionType[Math.floor(Math.random() * slotActionType.length)];

                        air_drop_result = actionType == 1 ? +air_drop_result + +slotResult : air_drop_result;
                        burn_result = actionType == 2 ? +burn_result + +slotResult : burn_result;
                        mint_result = actionType == 3 ? +mint_result + +slotResult : mint_result;

                        result.type = actionTypeEnum[`${actionType}`]; // burn mint airdop
                        result.value = slotResult;
                        i++
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
        return contractSpin
    })
    return slotResult;
}


app.get('/slotMachinResult', async (req, res) => {

    let slotResults = await spinSlotMachine()

    //insert slot result
    let insert = await addOrUpdateresult(slotResults)

    //check day if 7 days 
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();

    let getAllResultsByDate = await getresultByDate(dateFormatted)
    
    if (getAllResultsByDate.Count == 7){
        var air_drop_result = 0;
        var burn_result = 0;
        var mint_result = 0;
        var actions =[];
        var dominantAction;
        const actionTypeEnum = {
            AIR_DROP:1,
            BURN:2,
            MINT:3
        }
        const valueEnum = {
            AIR_DROP:air_drop_result,
            BURN:burn_result,
            MINT:mint_result
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
app.get('/resetData', async (req, res) => {
    var dateNow = Date.now();
    var today = new Date(dateNow);
    var dateFormatted = today.toDateString();

    await deleteResultByDate(dateFormatted)
    await deleteOverAllResultByDate(dateFormatted)
})
app.post('/rouletteAction', function (req, res) {
    //now req.body will be populated with the object you sent
    var rouletteResultJSON = JSON.parse(Object.keys(req.body));
    var roulleteResult = rouletteResultJSON['rouletteResult'];

    let initialSupply = await 
   

    console.log(Math.floor(roulleteResult * 3000000000000),'roulette to send action');
    // console.log(rouletteResultJSON['rouletteResult']);
    // console.log(req.rouletteResult)
    // if (req.dominant == 1) {
    //     contract.transfer('0x781995eD1c9fA6812EC2653b5F2E0e6A21839F3b', req.rouletteResult);
    // } else if (req.dominant == 2) {
    //     contract._burnFrom('0x781995eD1c9fA6812EC2653b5F2E0e6A21839F3b', req.rouletteResult);
    // } else {
    //     contract.addMinter('0x781995eD1c9fA6812EC2653b5F2E0e6A21839F3b');
    //     contract.mint('0x781995eD1c9fA6812EC2653b5F2E0e6A21839F3b', req.rouletteResult);
    // }

    // contract.then(function (results) {
    //     console.log(results);
    // });
});





