const crypto                                = require('crypto');
const { Api, JsonRpc, Serialize }           = require('eosjs');
const { JsSignatureProvider, PrivateKey }   = require('eosjs/dist/eosjs-jssig');
const fetch                                 = require('node-fetch');
const cpus                                  = require('os').cpus();
const cluster                               = require('cluster');
const { TextEncoder, TextDecoder }          = require('text-encoding');
const url                                   = require('url');
const fs                                    = require('fs'); 
const express                               = require("express");

const app                                   = express(); 
const port                                  = 5000; 
const nodeType                              = (cluster.isMaster) ? 'Master' : 'Worker';

// Body parser
app.use(express.urlencoded({ extended: false }));


if (cluster.isMaster) {
    
    for (let i = 0; i < (cpus.length * 2); i++) {
        cluster.fork(); 
    }; 
    cluster.on('exit', (worker, code, signal) => {
        console.log('Worker #' + worker.process.pid, 'exited');
        cluster.fork();
    }); 
    
} else {
    
    // Home route
    app.get("/", (req, res) => {
        
      //  sets the header of the response to the user and the type of response that you would be sending back
      res.setHeader('Content-Type', 'text/html');
      res.write("<html>"); 
      res.write("<head>"); 
      res.write("<title>now-express</title>"); 
      res.write("</head>"); 
      res.write("<body>"); 
      res.write(`<h1>now-express ${ process.pid }</h1>`); 
      res.write("</body>"); 
      res.write("<html>"); 
      res.end(); 
        
    });
    
    // echo route
    app.get("/echo", (req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.end(`ECHO : ${req.url }`);
    });
    
    // packedtrx API
    app.get("/packedtrx", (req, res) => {
        packedtrx({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx", (req, res) => {
        packedtrx({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_free_trx API
    app.get("/packedtrx_free_trx", (req, res) => {
        packedtrx_free_trx({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_free_trx", (req, res) => {
        packedtrx_free_trx({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_private_key API
    app.get("/packedtrx_private_key", (req, res) => {
        packedtrx_private_key({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key", (req, res) => {
        packedtrx_private_key({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx API
    app.get("/packedtrx_limitlesswax", (req, res) => {
        packedtrx_limitlesswax({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_limitlesswax", (req, res) => {
        packedtrx_limitlesswax({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });


    app.get("/trace", (req, res) => {
        fetch(
            'https://www.cloudflare.com/cdn-cgi/trace'
        ).then(
            result => result.text()
        ).then(result => {
            console.log(result)
            res.setHeader('Content-Type', 'text/html');
            res.write("<html>"); 
            res.write("<head>"); 
            res.write("<title>trace</title>"); 
            res.write("</head>"); 
            res.write("<body>"); 
            res.write(`<pre>${ result }</pre>`); 
            res.write("</body>"); 
            res.write("<html>"); 
            res.end();
        });
    });
    
    // Listen on port 5000
    app.listen(port, () => {
        console.log(`Server is booming on port 5000 Visit http://localhost:5000`);
    }); 
    
}; 

console.log(nodeType + ' #' + process.pid, 'is running');



































const defaultPrivateKey   = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']; 
//  5KJEamqm4QT2bmDwQEmRAB3EzCrCmoBoX7f6MRdrhGjGgHhzUyf
const signatureProvider     = new JsSignatureProvider(defaultPrivateKey); 



//  const endpoint      = 'https://wax.blokcrafters.io'; 
const endpoint      = 'https://api.wax.alohaeos.com'; 
//  const endpoint      = 'https://chain.wax.io'; 
const rpc           = new JsonRpc(endpoint, { fetch }); 

function arrayToHex(data) {
    let result = '';
    for (const x of data) {
        result += ('00' + x.toString(16)).slice(-2);
    }; return result;
}; 
async function get_rawabi_and_abi(account){
    try {
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


async function packedtrx(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      const abiObj        = await get_rawabi_and_abi('m.federation');

      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "m.federation", 
            "name"            : "mine", 
            "authorization"   : [{
                "actor"           : DATA['actor'],
                "permission"      : "active"
            }],
            "data"            : {
                "miner"           : DATA['actor'], // wax.userAccount
                "nonce"           : DATA['nonce']
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      return new Promise(function(resolve, reject) {
        resolve({packed_trx, serializedTransaction : serial, transactions}); 
      }); 
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function packedtrx_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('yeomenwarder');

        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
          "expiration"        : DATA['expiration'],
          "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
          "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
          "actions": [{
            "account"       : "yeomenwarder", 
            "name"          : "warder", 
            "authorization"     : [{
					    "actor"         	: 'yeomenwarder', 
					    "permission"    	: "guard"
            }], 
            data        : {
                message         : DATA['message']
            }
          }, {
              "account"       : "m.federation", 
              "name"          : "mine", 
              "authorization"     : [{
                  "actor"         : DATA['actor'],
                  "permission"    : "active"
              }],
              data        : {
                  miner           : DATA['actor'], // wax.userAccount
                  nonce           : DATA['nonce']
              }
          }], 
          "context_free_actions"      : [],
          "transaction_extensions"    : []
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_private_key(DATA){

  const _privateKeys   = ['5KVbwnxCX1fC2SoNmE6kmZTGC7d31eG7JgDkLFqsDdGmTo9gd2e']; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA)

  try {
    const chainId       = DATA['chainId'];
    const abiObj        = await get_rawabi_and_abi('m.federation');

    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
    const transaction   = {
      "expiration"        : DATA['expiration'],
      "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
      "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
      "actions"           : [{
        "account"           : "boost.wax", 
        "name"              : "noop", 
        "authorization"     : [{
            "actor"             : 'stakebymywax', // Actor
            "permission"        : "active"
        }], 
        "data"              : null
      }, {
        "account"           : "m.federation", 
        "name"              : "mine", 
        "authorization"     : [{
            "actor"             : DATA['actor'], // Actor
            "permission"        : "active"
        }], 
        "data"              : {
            "miner"             : DATA['actor'], // wax.userAccount
            "nonce"             : DATA['nonce']
        }
      }]
    }; 
    
    const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
    const serial        = api.serializeTransaction(transactions);
    const packed_trx    = arrayToHex(serial); 
    return new Promise(function(resolve, reject) {
        resolve({packed_trx, serializedTransaction : serial, transactions}); 
    });
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function packedtrx_limitlesswax(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('limitlesswax');

        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('limitlesswax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "limitlesswax", 
                "name"            : "mine", 
                "authorization"   : [{
                  "actor"           : 'limitlesswax',
                  "permission"      : "active"
                }], 
                "data"            : {
                  "info"            : 'cpu', 
                  "miner"           : DATA['actor']
                }
            }, 
			//	{
            //	    "account"         : "m.federation", 
            //	    "name"            : "setland", 
            //	    "authorization"   : [{
            //	      "actor"           : DATA['actor'],
            //	      "permission"      : "active"
            //	    }],
            //	    "data"            : {
            //	      "account"         : DATA['actor'], 
            //	      "land_id"         :'1099512959533'
            //	    }
            //	}, {
            //	    "account"         : "m.federation", 
            //	    "name"            : "setland", 
            //	    "authorization"   : [{
            //	      "actor"           : DATA['actor'],
            //	      "permission"      : "active"
            //	    }],
            //	    "data"            : {
            //	      "account"         : DATA['actor'], 
            //	      "land_id"         :'1099512961342'
            //	    }
            //	}, 
			{
                "account"         : "m.federation", 
                "name"            : "mine", 
                "authorization"   : [{
                  "actor"           : DATA['actor'],
                  "permission"      : "active"
                }],
                "data"            : {
                  "miner"           : DATA['actor'], // wax.userAccount
                  "nonce"           : DATA['nonce']
                }
            }, {
                "account"         : "alien.worlds", 
                "name"            : "transfer", 
                "authorization"   : [{
                  "actor"           : DATA['actor'],
                  "permission"      : "active"
                }],
                "data"            : {
                  "from"            : DATA['actor'], 
                  "to"              : "limitlesswco", 
                  "quantity"        : '0.0100 TLM', 
                  "memo"            : 'Limitlesswax CPU Payment'
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
