const crypto                                = require('crypto');
const { Api, JsonRpc, Serialize }           = require('eosjs');
const { JsSignatureProvider, PrivateKey }   = require('eosjs/dist/eosjs-jssig');
const fetch                                 = require('node-fetch');
const { TextEncoder, TextDecoder }          = require('text-encoding');
const url                                   = require('url');
const fs                                    = require('fs'); 
const express                               = require("express");

const app   = express(); 
const port  = 5000; 

const privateKeys = ['5KJEamqm4QT2bmDwQEmRAB3EzCrCmoBoX7f6MRdrhGjGgHhzUyf']; 
const signatureProvider = new JsSignatureProvider(privateKeys);

// Body parser
app.use(express.urlencoded({ extended: false }));

// Home route
app.get("/", (req, res) => {
    
    //  sets the header of the response to the user and the type of response that you would be sending back
    res.setHeader('Content-Type', 'text/html');
    res.write("<html>"); 
    res.write("<head>"); 
    res.write("<title>now-express</title>"); 
    res.write("</head>"); 
    res.write("<body>"); 
    res.write("<h1>now-express</h1>"); 
    res.write("</body>"); 
    res.write("<html>"); 
    res.end(); 
    
});

// echo route
app.get("/echo", (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(`ECHO : ${req.url }`);
});

// mine API
app.get("/mine", (req, res) => {
    if(
        req.url.match('mine') && 
        req.url.match('waxaccount') && 
        req.url.match('difficulty') && 
        req.url.match('lastMineTx') && 
        url.parse(req.url,true).query && 
        url.parse(req.url,true).query.waxaccount && 
        url.parse(req.url,true).query.difficulty && 
        url.parse(req.url,true).query.lastMineTx
    ){
        
        console.log( req.url ); 
        console.log( url.parse(req.url,true).query.waxaccount ); 
        mine({
            'waxaccount' : url.parse(req.url,true).query.waxaccount, 
            'difficulty' : url.parse(req.url,true).query.difficulty, 
            'lastMineTx' : url.parse(req.url,true).query.lastMineTx
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
        }); 
        
    }else{
        res.setHeader('Content-Type', 'text/html');
        res.send('?');
    }; 
});

// packedtrx API
app.get("/packedtrx", (req, res) => {
    packedtrx({
        'chainId'           : (url.parse(req.url,true).query.chainId 			|| '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
        'expiration'        : (url.parse(req.url,true).query.expiration 		|| '2021-06-29T03:14:42.000'), 
        'block_num_or_id' 	: (url.parse(req.url,true).query.block_num_or_id 	|| '126988588-1677423057'), 
        'actor'             : (url.parse(req.url,true).query.actor 				|| 'w5fes.wam'), 
        'nonce'             : (url.parse(req.url,true).query.nonce 				|| '543B189423D6B4BF')
    }).then(result => {
        res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(result))
        res.end();
    }); 
});
app.post("/packedtrx", (req, res) => {
    packedtrx({
        'chainId'           : (url.parse(req.url,true).query.chainId 			|| '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
        'expiration'        : (url.parse(req.url,true).query.expiration 		|| '2021-06-29T03:14:42.000'), 
        'block_num_or_id' 	: (url.parse(req.url,true).query.block_num_or_id 	|| '126988588-1677423057'), 
        'actor'             : (url.parse(req.url,true).query.actor 				|| 'w5fes.wam'), 
        'nonce'             : (url.parse(req.url,true).query.nonce 				|| '543B189423D6B4BF')
    }).then(result => {
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
        res.end();
    }); 
});

// Listen on port 5000
app.listen(port, () => {
    console.log(`Server is booming on port 5000 Visit http://localhost:5000`);
});


//	https://awmine-express.vercel.app/packedtrx?actor=w5fes.wam&block_num_or_id=126987084&block_prefix=1571208434
//	https://awmine-express.vercel.app/packedtrx?actor=w5fes.wam&block_num_or_id=126988588-1677423057&nonce=543B189423D6B4BF&expiration=2021-06-29T03:14:42.000&chainId=1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4



































async function mine(DATA){

    const nameToArray = (name) => {
        const sb = new Serialize.SerialBuffer({
            textEncoder: new TextEncoder,
            textDecoder: new TextDecoder
        }); sb.pushName(name); return sb.array; 
    }; 

    const getRand = () => {
        const arr = new Uint8Array(8); 
        for (let i=0; i < 8; i++){
            const rand = Math.floor(Math.random() * 255); 
            arr[i] = rand; 
        }; return arr; 
    }; 
    const toHex = (buffer) => {
        return [...new Uint8Array (buffer)]
        .map (b => b.toString (16).padStart (2, "0"))
        .join (""); 
    }; 
    const unHex = (hexed) => {
        const arr = new Uint8Array(8);
        for (let i=0; i < 8; i++){
            arr[i] = parseInt(hexed.slice(i*2, (i+1)*2), 16); 
        }; return arr; 
    }; 

    //    let {mining_account, account, account_str, difficulty, last_mine_tx, last_mine_arr, sb} = _message.data;
    
    /*! xxxx.wam !*/
    //  console.log( DATA.waxaccount ); 
    //  console.log( nameToArray( DATA.waxaccount ) ); 
    //  console.log( DATA.difficulty ); 
    //  console.log( DATA.lastMineTx ); 

    /*! GET PARAM FROM DATA !*/ mining_account  = 'm.federation'; 
    /*! GET PARAM FROM DATA !*/ account         = nameToArray( DATA.waxaccount ); // [0, 0, 144, 134, 3, 126, 33, 0]; 
    /*! GET PARAM FROM DATA !*/ account_str     = DATA.waxaccount ; 
    /*! GET PARAM FROM DATA !*/ difficulty      = DATA.difficulty; 
    /*! GET PARAM FROM DATA !*/ last_mine_tx    = DATA.lastMineTx.substr(0, 16); 
    /*! GET PARAM FROM DATA !*/ last_mine_arr   = unHex(last_mine_tx); 
    
    account = account.slice(0, 8);
    
    const is_wam = account_str.substr(-4) === '.wam';
    
    let good = false, itr = 0, rand = 0, hash, hex_digest, rand_arr, last;
    
    console.log(`Performing work with difficulty ${difficulty}, last tx is ${last_mine_tx}...`);
    if (is_wam){
        console.log(`Using WAM account`);
    }
    
    const start = (new Date()).getTime();
    
    while (!good){
        
        rand_arr = getRand();
        
        const combined = new Uint8Array(account.length + last_mine_arr.length + rand_arr.length);
        combined.set(account);
        combined.set(last_mine_arr, account.length);
        combined.set(rand_arr, account.length + last_mine_arr.length);

        hash = await crypto.createHash('sha256').update( combined.slice(0, 24) ).digest('Uint8Array');

        hex_digest = toHex(hash);
        
        //  console.log( `${itr} ${hex_digest}\n ` ); 
        
        if (is_wam){
            good = hex_digest.substr(0, 4) === '0000';
        } else {
            good = hex_digest.substr(0, 6) === '000000';
        }; 
        
        if (good){
            if (is_wam){
                last = parseInt(hex_digest.substr(4, 1), 16);
            } else {
                last = parseInt(hex_digest.substr(6, 1), 16);
            }; good &= (last <= difficulty);
        }; 
        
        itr++;
        
        if (itr % 10000 === 0){
            console.log(`Still mining - tried ${itr} iterations ${((new Date()).getTime()-start) / 1000}s`);
        }; 
        
        if (!good){
            hash = null;
        }; 
        
        if (itr >= 100000 * 10){
            rand_arr    = ''; 
            hex_digest  = `SORRY WE CAN NOT SOLVED LOOP ${ itr }`; 
            break; 
        }; 

    }; 
    
    const end       = (new Date()).getTime();
    const rand_str  = toHex(rand_arr);
    
    console.log(`Found hash in ${itr} iterations with ${account} ${rand_str}, last = ${last}, hex_digest ${hex_digest} taking ${(end-start) / 1000}s`)
    const mine_work     = {account:account_str, nonce:rand_str, answer:hex_digest}; 
    
    //  this.postMessage(mine_work); 
    //  return mine_work; 

    console.log( mine_work ); 
    
    return new Promise(function(resolve, reject) {
        resolve({account:account_str, nonce:rand_str, answer:hex_digest}); 
    });
    
    //  return new Promise(function(resolve, reject) {
    //      setTimeout(function(){
    //      }, 21500); 
    //  });
}; 

function arrayToHex(data) {
    let result = '';
    for (const x of data) {
        result += ('00' + x.toString(16)).slice(-2);
    }; return result;
}; 
async function get_rawabi_and_abi(account){
    try {
        const endpoint      = 'https://wax.blokcrafters.io';
        const rpc           = new JsonRpc(endpoint, { fetch }); 
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder, textEncoder: new TextEncoder });

        const rawAbi        = (await api.abiProvider.getRawAbi(account)).abi;
        const abi           = await api.rawAbiToJson(rawAbi);

        const result        = {
            accountName : account,
            rawAbi,
            abi
        }; return result;
    } catch (err) {
        console.log(err);
    }
}; 


//	'chainId'           : (url.parse(req.url,true).query.chainId 			|| '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
//	'expiration'        : (url.parse(req.url,true).query.expiration 		|| '2021-06-28T03:09:05.000'), 
//	'block_num_or_id' 	: (url.parse(req.url,true).query.block_num_or_id 	|| 12698259), 
//	'actor'             : (url.parse(req.url,true).query.actor 				|| 'xxxxx.wam'), 
//	'nonce'             : (url.parse(req.url,true).query.nonce 				|| '0D4A83E7E2623981')
async function packedtrx(DATA){
    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('m.federation');

        const rpc           = new JsonRpc('http://wax.blokcrafters.io');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
                    "account"       : "m.federation", 
                    "name"          : "mine", 
                    "authorization"     : [{
                        "actor"         : DATA['actor'],
                        "permission" 	: "active"
                    }],
                    data        : {
                        //  miner : wax.userAccount, 
                        //  nonce : '0000908603AC56E1080D4A83E7E2623981'
                        miner           : DATA['actor'], // wax.userAccount
                        nonce           : DATA['nonce']
                    }
                }
            ]
        }; 

        const result        = await api.transact(transaction, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        const packed_trx    = arrayToHex(result.serializedTransaction); 
        //  console.log(result);
        //  console.log(packed_trx); 
        //  console.log(result.serializedTransaction.toString()); 

        return new Promise(function(resolve, reject) {
			resolve({packed_trx, serializedTransaction : result.serializedTransaction, transaction}); 
        });

    } catch (err) {
        console.log('err is', err);
    }
}; 

//  https://replit.com/talk/share/NodeJS-html-Host/31118
//  https://replit.com/talk/learn/Web-Server-Using-Nodejs/39555
