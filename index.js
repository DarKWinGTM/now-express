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

const privateKeys           = ['5KJEamqm4QT2bmDwQEmRAB3EzCrCmoBoX7f6MRdrhGjGgHhzUyf']; 
const signatureProvider     = new JsSignatureProvider(privateKeys);

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

    // packedtrx swap API
    app.get("/packedtrx_swap", (req, res) => {
        packedtrx_swap({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 0.0000).toFixed(4), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_swap", (req, res) => {
        packedtrx_swap({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 0.0000).toFixed(4), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx transfer API
    app.get("/packedtrx_transfer", (req, res) => {
        packedtrx_transfer({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : (function (){
                if (
                    url.parse(req.url,true).query.symbol && 
                    url.parse(req.url,true).query.symbol.match('TLM-')
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity)           || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000001).toFixed(8)
                }; 
            })(), 
            'to'                : (url.parse(req.url,true).query.to                             || 'xxxxx.wam'), 
            'memo'              : (url.parse(req.url,true).query.memo                           || ''), 
            'symbol'            : (url.parse(req.url,true).query.symbol                         || 'WAX-eosio.token')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_transfer", (req, res) => {
        packedtrx_transfer({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : (function (){
                if (
                    url.parse(req.url,true).query.symbol && 
                    url.parse(req.url,true).query.symbol.match('TLM-')
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity)           || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000001).toFixed(8)
                }; 
            })(), 
            'to'                : (url.parse(req.url,true).query.to                             || 'xxxxx.wam'), 
            'memo'              : (url.parse(req.url,true).query.memo                           || ''), 
            'symbol'            : (url.parse(req.url,true).query.symbol                         || 'WAX-eosio.token')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx setland API
    app.get("/packedtrx_setland", (req, res) => {
        packedtrx_setland({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000'), 
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_setland", (req, res) => {
        packedtrx_setland({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx settool API
    app.get("/packedtrx_settool", (req, res) => {
        packedtrx_settool({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_settool", (req, res) => {
        packedtrx_settool({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx stake cpu API
    app.get("/packedtrx_stakecpu", (req, res) => {
        packedtrx_stakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_stakecpu", (req, res) => {
        packedtrx_stakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx stake net API
    app.get("/packedtrx_stakenet", (req, res) => {
        packedtrx_stakenet({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_stakenet", (req, res) => {
        packedtrx_stakenet({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx buy ram API
    app.get("/packedtrx_buyram", (req, res) => {
        packedtrx_buyram({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_buyram", (req, res) => {
        packedtrx_buyram({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'       : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx unstake API
    app.get("/packedtrx_unstakecpu", (req, res) => {
        packedtrx_unstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_unstakecpu", (req, res) => {
        packedtrx_unstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx rent stake cpu API
    app.get("/packedtrx_rentstakecpu", (req, res) => {
        packedtrx_rentstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_rentstakecpu", (req, res) => {
        packedtrx_rentstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx rent unstake cpu API
    app.get("/packedtrx_rentunstakecpu", (req, res) => {
        packedtrx_rentunstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_rentunstakecpu", (req, res) => {
        packedtrx_rentunstakecpu({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx rent charge API
    app.get("/packedtrx_rentcharge", (req, res) => {
        packedtrx_rentcharge({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_rentcharge", (req, res) => {
        packedtrx_rentcharge({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 

    // packedtrx rent claim nft API
    app.get("/packedtrx_claimnft", (req, res) => {
        packedtrx_claimnft({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_claimnft", (req, res) => {
        packedtrx_claimnft({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 50.0000).toFixed(4), 
			'quantity'          : (
								  parseFloat((url.parse(req.url,true).query.amount) 			|| 50.0000).toFixed(4) / 100
			).toFixed(8), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return 'resourceless'
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'memo'              : (function (memo){
                if (memo == '' || memo == null || memo == 'None'){
                    return `CPU loan ${ parseFloat((url.parse(req.url,true).query.amount) || 50.0000).toFixed(0) } WAX`
                }else{
                    return url.parse(req.url,true).query.memo
                }; 
            })(url.parse(req.url,true).query.memo)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 

    // packedtrx rent send nft API
    app.get("/packedtrx_sendnft", (req, res) => {
        packedtrx_sendnft({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return to
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'toolid' 			: (url.parse(req.url,true).query.toolid 						|| '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_sendnft", (req, res) => {
        packedtrx_sendnft({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return to
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to), 
            'toolid' 			: (url.parse(req.url,true).query.toolid 						|| '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 
	
    // packedtrx free stake API
    app.get("/packedtrx_freestake", (req, res) => {
        packedtrx_freestake({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return (url.parse(req.url,true).query.actor                          || 'xxxxx.wam')
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_freestake", (req, res) => {
        packedtrx_freestake({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return (url.parse(req.url,true).query.actor                          || 'xxxxx.wam')
                }else{
                    return to
                }; 
            })(url.parse(req.url,true).query.to)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 
	
    // packedtrx refund stake API
    app.get("/packedtrx_refund", (req, res) => {
        packedtrx_refund({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_refund", (req, res) => {
        packedtrx_refund({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 

    // packedtrx rent stake planet nft API
    app.get("/packedtrx_stakeplanet", (req, res) => {
        packedtrx_stakeplanet({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_stakeplanet", (req, res) => {
        packedtrx_stakeplanet({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam')
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
















































//  const endpoint      = 'https://wax.blokcrafters.io'; 
//  const endpoint      = 'https://api.wax.alohaeos.com'; 
const endpoint      = 'https://wax.pink.gg'; 
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
            "actions": [
                {
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
                }
            ]
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
async function packedtrx_swap(DATA){

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
            "actions": [
                {
                    "account": "alien.worlds",
                    "name": "transfer",
                    "authorization": [
                        {
                            "actor": DATA['actor'],
                            "permission": "active"
                        }
                    ],
                    'data': {
                        "from"      : DATA['actor'],
                        "to"        : "alcorammswap",
                        "quantity"  : `${ DATA['amount'] } TLM`,
                        "memo"      : `${ DATA['quantity'] * (100 / 100) } WAX@eosio.token`
                    },
                }, 
            ]
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
async function packedtrx_transfer(DATA){

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
                "account"           : `${ DATA['symbol'].split('-')[1] }`,
                "name"              : "transfer",
                "authorization"     : [
                    {
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }
                ],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : DATA['to'],
                    "quantity"          : `${ DATA['quantity'] } ${ DATA['symbol'].split('-')[0] }`,
                    "memo"              : `${ DATA['memo'] }`
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_transfer_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_transfer_freeBandwidth(DATA){

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                "account"           : `${ DATA['symbol'].split('-')[1] }`,
                "name"              : "transfer",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : DATA['to'],
                    "quantity"          : `${ DATA['quantity'] } ${ DATA['symbol'].split('-')[0] }`,
                    "memo"              : `${ DATA['memo'] }`
                },
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
async function packedtrx_setland(DATA){

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
            "actions": [
                {
                    'account'           : 'm.federation',
                    'name'              : 'setland', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'account'           : DATA['actor'], 
                        'land_id'           : DATA['landid']
                    },
                }, 
            ]
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
async function packedtrx_settool(DATA){

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
            "actions": [
                {
                    'account'           : 'm.federation',
                    'name'              : 'setbag', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'account'           : DATA['actor'],
                        'items'             : DATA['toolid']
                    },
                }, 
            ]
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
async function packedtrx_stakecpu(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('boost.wax');

        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('boost.wax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'delegatebw', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'from'                  : DATA['actor'],
                        'receiver'              : DATA['actor'],
                        'stake_net_quantity'    : `0.00000000 WAX`, 
                        'stake_cpu_quantity'    : `${ DATA['quantity'] } WAX`,
                        'transfer'              : false
                    },
                }, 
            ]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_stakecpu_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_stakecpu_freeBandwidth(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('boost.wax');

        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('boost.wax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'eosio',
                'name'              : 'delegatebw', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'from'                  : DATA['actor'],
                    'receiver'              : DATA['actor'],
                    'stake_net_quantity'    : `0.00000000 WAX`, 
                    'stake_cpu_quantity'    : `${ DATA['quantity'] } WAX`,
                    'transfer'              : false
                },
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
async function packedtrx_stakenet(DATA){

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
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'delegatebw', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'from'                  : DATA['actor'],
                        'receiver'              : DATA['actor'],
                        'stake_net_quantity'    : `${ DATA['quantity'] } WAX`, 
                        'stake_cpu_quantity'    : `0.00000000 WAX`,
                        'transfer'              : false
                    },
                }, 
            ]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_stakenet_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_stakenet_freeBandwidth(DATA){

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'eosio',
                'name'              : 'delegatebw', 
                "authorization"     : [
                    {
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }
                ],
                'data'              : {
                    'from'                  : DATA['actor'],
                    'receiver'              : DATA['actor'],
                    'stake_net_quantity'    : `${ DATA['quantity'] } WAX`, 
                    'stake_cpu_quantity'    : `0.00000000 WAX`,
                    'transfer'              : false
                },
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
async function packedtrx_buyram(DATA){

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
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'buyram', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'payer' 				: DATA['actor'],
                        'receiver'              : DATA['actor'],
                        'quant' 				: `${ DATA['quantity'] } WAX`,
                    },
                }, 
            ]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_buyram_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_buyram_freeBandwidth(DATA){

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'eosio',
                'name'              : 'buyram', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'payer' 				: DATA['actor'],
                    'receiver'              : DATA['actor'],
                    'quant' 				: `${ DATA['quantity'] } WAX`,
                },
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
async function packedtrx_freeram(DATA){

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
            "actions"           : [{
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
                'account'           : 'eosio',
                'name'              : 'buyrambytes', 
                "authorization"     : [{
                    "actor"         	: 'yeomenwarder', 
                    "permission"    	: "guard"
                }],
                'data'              : {
                    'payer'             : 'yeomenwarder',
                    'receiver'          : DATA['actor'],
                    'bytes'             : `591`,
                },
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
async function packedtrx_unstakecpu(DATA){

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
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'undelegatebw', 
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        'from'                  : DATA['actor'],
                        'receiver'              : DATA['actor'],
                        'unstake_net_quantity'  : `0.00000000 WAX`, 
                        'unstake_cpu_quantity'  : `${ DATA['quantity'] } WAX`,
                    },
                }, 
            ]
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
async function packedtrx_rentstakecpu(DATA){

    console.log(DATA); 
    console.log([{
            "account"           : 'eosio.token',
            "name"              : "transfer",
            "authorization"     : [
                {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }
            ],
            'data'              : {
                "from"              : DATA['actor'],
                "to"                : DATA['to'],
                "quantity"          : `${ DATA['quantity'] } WAX`,
                "memo"              : DATA['memo']
            },
        }, {
            "account"           : 'eosio.token',
            "name"              : "transfer",
            "authorization"     : [
                {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }
            ],
            'data'              : {
                "from"              : DATA['actor'],
                "to"                : 'stakebymywax',
                "quantity"          : `${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`,
                "memo"              : DATA['memo']
            },
        }
    ]); 
    console.log(`CHARGE : ${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`); 

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
                    "account"           : 'eosio.token',
                    "name"              : "transfer",
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        "from"              : DATA['actor'],
                        "to"                : DATA['to'],
                        "quantity"          : `${ DATA['quantity'] } WAX`,
                        "memo"              : DATA['memo']
                    },
                }, {
                    "account"           : 'eosio.token',
                    "name"              : "transfer",
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        "from"              : DATA['actor'],
                        "to"                : 'stakebymywax',
                        "quantity"          : `${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`,
                        "memo"              : DATA['memo']
                    },
                }
            ]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_rentstakecpu_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_rentstakecpu_freeBandwidth(DATA){

    console.log(DATA); 
    console.log([{
        "account"           : 'eosio.token',
        "name"              : "transfer",
        "authorization"     : [{
            "actor"             : DATA['actor'],
            "permission"        : "active"
        }],
        'data'              : {
            "from"              : DATA['actor'],
            "to"                : DATA['to'],
            "quantity"          : `${ DATA['quantity'] } WAX`,
            "memo"              : DATA['memo']
        },
    }, {
        "account"           : 'eosio.token',
        "name"              : "transfer",
        "authorization"     : [
            {
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }
        ],
        'data'              : {
            "from"              : DATA['actor'],
            "to"                : 'stakebymywax',
            "quantity"          : `${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`,
            "memo"              : DATA['memo']
        },
    }]); 
    console.log(`CHARGE : ${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`); 

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                "account"           : 'eosio.token',
                "name"              : "transfer",
                "authorization"     : [
                    {
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }
                ],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : DATA['to'],
                    "quantity"          : `${ DATA['quantity'] } WAX`,
                    "memo"              : DATA['memo']
                },
            }, {
                "account"           : 'eosio.token',
                "name"              : "transfer",
                "authorization"     : [
                    {
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }
                ],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : 'stakebymywax',
                    "quantity"          : `${ (( DATA['quantity'] * 0.05 ) + 0.35000000).toFixed(8) } WAX`,
                    "memo"              : DATA['memo']
                },
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
async function packedtrx_rentunstakecpu(DATA){

    console.log(DATA); 
    console.log([{
            "account"           : 'eosio.token',
            "name"              : "transfer",
            "authorization"     : [
                {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }
            ],
            'data'              : {
                "from"              : DATA['actor'],
                "to"                : DATA['to'],
                "quantity"          : `${ DATA['quantity'] } WAX`,
                "memo"              : DATA['memo']
            },
        }, {
            "account"           : 'eosio.token',
            "name"              : "transfer",
            "authorization"     : [
                {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }
            ],
            'data'              : {
                "from"              : DATA['actor'],
                "to"                : 'stakebymywax',
                "quantity"          : `${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`,
                "memo"              : DATA['memo']
            },
        }
    ]); 
    console.log(`CHARGE : ${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`); 

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
                    "account"           : 'eosio.token',
                    "name"              : "transfer",
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        "from"              : DATA['actor'],
                        "to"                : DATA['to'],
                        "quantity"          : `${ DATA['quantity'] } WAX`,
                        "memo"              : DATA['memo']
                    },
                }, {
                    "account"           : 'eosio.token',
                    "name"              : "transfer",
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        "from"              : DATA['actor'],
                        "to"                : 'stakebymywax',
                        "quantity"          : `${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`,
                        "memo"              : DATA['memo']
                    },
                }
            ]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_rentunstakecpu_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_rentunstakecpu_freeBandwidth(DATA){

    console.log(DATA); 
    console.log([{
        "account"           : 'eosio.token',
        "name"              : "transfer",
        "authorization"     : [{
            "actor"             : DATA['actor'],
            "permission"        : "active"
        }],
        'data'              : {
            "from"              : DATA['actor'],
            "to"                : DATA['to'],
            "quantity"          : `${ DATA['quantity'] } WAX`,
            "memo"              : DATA['memo']
        },
    }, {
        "account"           : 'eosio.token',
        "name"              : "transfer",
        "authorization"     : [
            {
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }
        ],
        'data'              : {
            "from"              : DATA['actor'],
            "to"                : 'stakebymywax',
            "quantity"          : `${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`,
            "memo"              : DATA['memo']
        },
    }]); 
    console.log(`CHARGE : ${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`); 

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                "account"           : 'eosio.token',
                "name"              : "transfer",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : DATA['to'],
                    "quantity"          : `${ DATA['quantity'] } WAX`,
                    "memo"              : DATA['memo']
                },
            }, {
                "account"           : 'eosio.token',
                "name"              : "transfer",
                "authorization"     : [
                    {
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }
                ],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : 'stakebymywax',
                    "quantity"          : `${ (( DATA['quantity'] * 0.10 ) + 0.16000000).toFixed(8) } WAX`,
                    "memo"              : DATA['memo']
                },
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
async function packedtrx_rentcharge(DATA){

    console.log(DATA); 
    console.log([
        {
            "account"           : 'eosio.token',
            "name"              : "transfer",
            "authorization"     : [
                {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }
            ],
            'data'              : {
                "from"              : DATA['actor'],
                "to"                : 'stakebymywax',
                "quantity"          : `${ (( DATA['quantity'] * 0.30 ) + 0.35000000).toFixed(8) } WAX`,
                "memo"              : DATA['memo']
            },
        }
    ]); 
    console.log(`CHARGE : ${ (( DATA['quantity'] * 0.30 ) + 0.35000000).toFixed(8) } WAX`); 

    try {
        const chainId       = DATA['chainId'];
        const abiObj        = await get_rawabi_and_abi('m.federation');

        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
                    "account"           : 'eosio.token',
                    "name"              : "transfer",
                    "authorization"     : [
                        {
                            "actor"             : DATA['actor'],
                            "permission"        : "active"
                        }
                    ],
                    'data'              : {
                        "from"              : DATA['actor'],
                        "to"                : 'stakebymywax',
                        "quantity"          : `${ (( DATA['quantity'] * 0.30 ) + 0.35000000).toFixed(8) } WAX`,
                        "memo"              : DATA['memo']
                    },
                }
            ]
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
async function packedtrx_claimnft(DATA){

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
                'account'           : 'm.federation',
                'name'              : 'claimnfts', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'miner' 			: DATA['actor']
                },
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
async function packedtrx_sendnft(DATA){

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
                'account'           : 'atomicassets',
                'name'              : 'transfer', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'from' 			: DATA['actor'], 
                    'to' 			: DATA['to'], 
                    'asset_ids' 	: DATA['toolid'], 
                    'memo' 			: ''
                },
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
//	async function packedtrx_freestake(DATA){
//	
//	    console.log(DATA)
//	
//	    try {
//	        const chainId       = DATA['chainId'];
//	        const abiObj        = await get_rawabi_and_abi('m.federation');
//	
//	        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
//	        api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
//	        const transaction   = {
//	            "expiration"        : DATA['expiration'],
//	            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
//	            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
//	            "actions": [{
//	                'account'           : 'free.cpu4',
//	                'name'              : 'getcpu', 
//	                "authorization"     : [{
//	                    "actor"             : DATA['actor'],
//	                    "permission"        : "active"
//	                }],
//	                'data'              : {
//	                    'username' 			: DATA['actor']
//	                },
//	            }]
//	        }; 
//	        
//	        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
//	        const serial        = api.serializeTransaction(transactions); 
//	        const packed_trx    = arrayToHex(serial); 
//	        return new Promise(function(resolve, reject) {
//	            resolve({packed_trx, serializedTransaction : serial, transactions}); 
//	        });
//	    } catch (err) {
//	        console.log('err is', err);
//	    }
//	}; 
async function packedtrx_freestake(DATA){

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
                'account'           : 'free.cpu4',
                'name'              : 'getcpu', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'username' 			: DATA['to']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_freestake_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_freestake_freeBandwidth(DATA){

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
                'account'           : 'boost.wax',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"             : 'boost.wax',
                    "permission"        : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'free.cpu4',
                'name'              : 'getcpu', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'username' 			: DATA['to']
                },
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
async function packedtrx_refund(DATA){

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
                'account'           : 'eosio',
                'name'              : 'refund', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'owner' 			: DATA['actor']
                },
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
async function packedtrx_stakeplanet(DATA){

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
                'account'           : 'alien.worlds',
                'name'              : 'transfer', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'from' 				: DATA['actor'], 
                    'to' 				: 'federation', 
                    'quantity' 			: '5.0000 TLM', 
                    'memo' 				: 'staking'
                },
            }, {
                'account'           : 'federation',
                'name'              : 'stake', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account' 			: DATA['actor'], 
                    'planet_name' 		: 'magor.world', 
                    'quantity' 			: '5.0000 TLM'
                },
            }
			//	, {
			//		"account"           : 'eosio.token',
			//		"name"              : "transfer",
			//		"authorization"     : [{
			//			"actor"             : DATA['actor'],
			//			"permission"        : "active"
			//		}],
			//		'data'              : {
			//			"from"              : DATA['actor'],
			//			"to"                : 'stakebymywax',
			//			"quantity"          : `1.00000000 WAX`,
			//			"memo"              : 'staking'
			//		}
			//	}
			]
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

//	alien.worlds > transfer
//	from
//	".cmxs.wam"
//	to
//	"federation"
//	quantity
//	"5.0000 TLM"
//	memo
//	"staking"
//	
//	federation > stake
//	account
//	".cmxs.wam"
//	planet_name
//	"magor.world"
//	quantity
//	"5.0000 TLM"






































//  https://awmine-express.vercel.app/packedtrx?actor=w5fes.wam&block_num_or_id=126987084&block_prefix=1571208434
//  https://awmine-express.vercel.app/packedtrx?actor=w5fes.wam&block_num_or_id=126988588-1677423057&nonce=543B189423D6B4BF&expiration=2021-06-29T03:14:42.000&chainId=1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4



        
        //  const result        = await api.transact(transaction, { broadcast: false, sign: false });
        //  const abis          = await api.getTransactionAbis(transaction);
        //  const requiredKeys  = privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        //  const packed_trx    = arrayToHex(result.serializedTransaction); 
        //  console.log(result);
        //  console.log(packed_trx); 
        //  console.log(result.serializedTransaction.toString()); 


/*!
        const action        = await api.serializeActions(transaction.actions);
        const result        = await api.transact(transaction, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        const packed_trx    = arrayToHex(result.serializedTransaction); 
        //  console.log(result);
        //  console.log(packed_trx); 
        //  console.log(result.serializedTransaction.toString()); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : result.serializedTransaction, transaction, action}); 
        });
    
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
!*/