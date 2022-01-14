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
    
    for (let i = 0; i < (cpus.length * 1); i++) {
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8)
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx swap API
    app.get("/packedtrx_swap_prv", (req, res) => {
        packedtrx_swap_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 0.0000).toFixed(4), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
          res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_swap_prv", (req, res) => {
        packedtrx_swap_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'amount'            : parseFloat((url.parse(req.url,true).query.amount)             || 0.0000).toFixed(4), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 0.00000000).toFixed(8), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
                    url.parse(req.url,true).query.symbol && (
                        url.parse(req.url,true).query.symbol.match('TLM-') || 
                        url.parse(req.url,true).query.symbol.match('NER-') || 
                        url.parse(req.url,true).query.symbol.match('NAR-') || 
                        url.parse(req.url,true).query.symbol.match('MAG-') || 
                        url.parse(req.url,true).query.symbol.match('EYE-') || 
                        url.parse(req.url,true).query.symbol.match('VEL-') || 
                        url.parse(req.url,true).query.symbol.match('KAV-')
                    )
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00000001).toFixed(8)
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
                    url.parse(req.url,true).query.symbol && (
                        url.parse(req.url,true).query.symbol.match('TLM-') || 
                        url.parse(req.url,true).query.symbol.match('NER-') || 
                        url.parse(req.url,true).query.symbol.match('NAR-') || 
                        url.parse(req.url,true).query.symbol.match('MAG-') || 
                        url.parse(req.url,true).query.symbol.match('EYE-') || 
                        url.parse(req.url,true).query.symbol.match('VEL-') || 
                        url.parse(req.url,true).query.symbol.match('KAV-')
                    )
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00000001).toFixed(8)
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

    // packedtrx_transfer_prv API
    app.get("/packedtrx_transfer_prv", (req, res) => {
        packedtrx_transfer_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : (function (){
                if (
                    url.parse(req.url,true).query.symbol && (
                        url.parse(req.url,true).query.symbol.match('TLM-') || 
                        url.parse(req.url,true).query.symbol.match('NER-') || 
                        url.parse(req.url,true).query.symbol.match('NAR-') || 
                        url.parse(req.url,true).query.symbol.match('MAG-') || 
                        url.parse(req.url,true).query.symbol.match('EYE-') || 
                        url.parse(req.url,true).query.symbol.match('VEL-') || 
                        url.parse(req.url,true).query.symbol.match('KAV-')
                    )
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00000001).toFixed(8)
                }; 
            })(), 
            'to'                : (url.parse(req.url,true).query.to                             || 'xxxxx.wam'), 
            'memo'              : (url.parse(req.url,true).query.memo                           || ''), 
            'symbol'            : (url.parse(req.url,true).query.symbol                         || 'WAX-eosio.token'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_transfer_prv", (req, res) => {
        packedtrx_transfer_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'quantity'          : (function (){
                if (
                    url.parse(req.url,true).query.symbol && (
                        url.parse(req.url,true).query.symbol.match('TLM-') || 
                        url.parse(req.url,true).query.symbol.match('NER-') || 
                        url.parse(req.url,true).query.symbol.match('NAR-') || 
                        url.parse(req.url,true).query.symbol.match('MAG-') || 
                        url.parse(req.url,true).query.symbol.match('EYE-') || 
                        url.parse(req.url,true).query.symbol.match('VEL-') || 
                        url.parse(req.url,true).query.symbol.match('KAV-')
                    )
                ){
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00010000).toFixed(4)
                }else{
                    return parseFloat((url.parse(req.url,true).query.quantity) || 0.00000001).toFixed(8)
                }; 
            })(), 
            'to'                : (url.parse(req.url,true).query.to                             || 'xxxxx.wam'), 
            'memo'              : (url.parse(req.url,true).query.memo                           || ''), 
            'symbol'            : (url.parse(req.url,true).query.symbol                         || 'WAX-eosio.token'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join()
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
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join()
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_reg_setland_yeomenwarder API
    app.get("/packedtrx_reg_setland_yeomenwarder", (req, res) => {
        packedtrx_reg_setland_yeomenwarder({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_reg_setland_yeomenwarder", (req, res) => {
        packedtrx_reg_setland_yeomenwarder({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_reg_setland_yeomenwarder_SelfBuy API
    app.get("/packedtrx_reg_setland_yeomenwarder_SelfBuy", (req, res) => {
        packedtrx_reg_setland_yeomenwarder_SelfBuy({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_reg_setland_yeomenwarder_SelfBuy", (req, res) => {
        packedtrx_reg_setland_yeomenwarder_SelfBuy({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_reg_setland_yeomenwarder_FreeRam API
    app.get("/packedtrx_reg_setland_yeomenwarder_FreeRam", (req, res) => {
        packedtrx_reg_setland_yeomenwarder_FreeRam({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_reg_setland_yeomenwarder_FreeRam", (req, res) => {
        packedtrx_reg_setland_yeomenwarder_FreeRam({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_setland_prv API
    app.get("/packedtrx_setland_prv", (req, res) => {
        packedtrx_setland_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_setland_prv", (req, res) => {
        packedtrx_setland_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'landid'            : (url.parse(req.url,true).query.landid                         || '0000000000000').match(/\d{13,13}/gi).join(), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
    
    // packedtrx_reg_settool_yeomenwarder API
    app.get("/packedtrx_reg_settool_yeomenwarder", (req, res) => {
        packedtrx_reg_settool_yeomenwarder({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_reg_settool_yeomenwarder", (req, res) => {
        packedtrx_reg_settool_yeomenwarder({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'message'           : (url.parse(req.url,true).query.message                        || '3u23197lkuht6o83')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx_settool_prv API
    app.get("/packedtrx_settool_prv", (req, res) => {
        packedtrx_settool_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_settool_prv", (req, res) => {
        packedtrx_settool_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
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
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)              || 0.00000000).toFixed(8)
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

    // packedtrx_freestake API
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

    // packedtrx_sendnft API
    app.get("/packedtrx_sendnft", (req, res) => {
        packedtrx_sendnft({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return (url.parse(req.url,true).query.actor || 'xxxxx.wam')
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
                    return (url.parse(req.url,true).query.actor || 'xxxxx.wam')
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
	
    // packedtrx_freestake API
    app.get("/packedtrx_freestake", (req, res) => {
        packedtrx_freestake({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'to'                : (function (to){
                if (to == '' || to == null || to == 'None'){
                    return (url.parse(req.url,true).query.actor || 'xxxxx.wam')
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
                    return (url.parse(req.url,true).query.actor || 'xxxxx.wam')
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

    // packedtrx_stakeplanet_prv API
    app.get("/packedtrx_stakeplanet_prv", (req, res) => {
        packedtrx_stakeplanet_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_stakeplanet_prv", (req, res) => {
        packedtrx_stakeplanet_prv({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    }); 

    // packedtrx_reg_sell_push API
    app.get("/packedtrx_reg_sell_push", (req, res) => {
        packedtrx_reg_sell_push({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 1.00000000).toFixed(8)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_reg_sell_push", (req, res) => {
        packedtrx_reg_sell_push({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), // 90 sec
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'xxxxx.wam'), 
            'toolid'            : (url.parse(req.url,true).query.toolid                         || '0000000000000,0000000000000').match(/\d{13,13}/gi), 
            'quantity'          : parseFloat((url.parse(req.url,true).query.quantity)           || 1.00000000).toFixed(8)
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





































//  function hexToUint8Array(hex){
//      if (typeof hex !== 'string') {
//          throw new Error('Expected string containing hex digits');
//      }
//      if (hex.length % 2) {
//          throw new Error('Odd number of hex digits');
//      }
//      const l = hex.length / 2;
//      const result = new Uint8Array(l);
//      for (let i = 0; i < l; ++i) {
//          const x = parseInt(hex.substr(i * 2, 2), 16);
//          if (Number.isNaN(x)) {
//              throw new Error('Expected hex string');
//          }
//          result[i] = x;
//      }
//      return result;
//  }; 
//  
//  wax.api.deserializeTransaction(
//  
//      (function ( trx ){
//          arr = []
//          for (i in trx){ arr.push( trx[i] ) }
//          return arr
//      })( hexToUint8Array('0dcec5613ec6f0c669de00000000060000000000ea305500b0cafe4873bd3e01000000000000a4e100409e9a2264b89a14000000000000a4e100a4e100010692500006000000000070ba0ab0ba000000000050299d0100000070ba0ab0ba00000000007ebca9009015bc4622276936a0a2c10a4d4de7340100a4e1000106925000000000a8ed32323100a4e10001069250011f54b5040001000000e1f5050000000008574158000000000857415800000000000000000000000080b3c2d82027693600ae5a8baa6cd4450100a4e1000106925000000000a8ed32321f00a4e100010692509015bc4622276936011f54b50400010000000473616c659015bc4622276936a0a2c10a4d4de7340100a4e1000106925000000000a8ed32323100a4e10001069250010785f0040001000000e1f5050000000008574158000000000857415800000000000000000000000080b3c2d82027693600ae5a8baa6cd4450100a4e1000106925000000000a8ed32321f00a4e100010692509015bc4622276936010785f00400010000000473616c6500') )
//  
//  ); 










//  const endpoint      = 'https://wax.blokcrafters.io'; 
const endpoint      = 'https://api.wax.alohaeos.com'; 
//  const endpoint      = 'https://wax.pink.gg'; 
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_swap_prv(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
                "account"           : "alien.worlds",
                "name"              : "transfer",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "from"              : DATA['actor'],
                    "to"                : "alcorammswap",
                    "quantity"          : `${ DATA['amount'] } TLM`,
                    "memo"              : `${ DATA['quantity'] * (100 / 100) } WAX@eosio.token`
                },
            }]
        }; 

        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());

        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, signatures : result.signatures}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_transfer(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        const freeRam       = await packedtrx_transfer_freeRam(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transaction, transactions, freeBandwidth, freeRam}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_transfer_prv(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
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
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());

        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, signatures : result.signatures}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_transfer_freeBandwidth(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_transfer_freeRam(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});

//  fetch("https://wax.greymass.com/v1/chain/get_table_rows", {
//    "headers": {
//      "accept": "*/*",
//      "accept-language": "en-US,en;q=0.9",
//      "cache-control": "no-cache",
//      "content-type": "text/plain;charset=UTF-8",
//      "pragma": "no-cache",
//      "sec-fetch-dest": "empty",
//      "sec-fetch-mode": "cors",
//      "sec-fetch-site": "cross-site",
//      "sec-gpc": "1"
//    },
//    "referrer": "https://wax.bloks.io/",
//    "referrerPolicy": "strict-origin-when-cross-origin",
//    "body": "{\"json\":true,\"code\":\"eosio\",\"scope\":\"eosio\",\"table\":\"rammarket\",\"lower_bound\":\"\",\"upper_bound\":\"\",\"index_position\":1,\"key_type\":\"\",\"limit\":10,\"reverse\":false,\"show_payer\":false}",
//    "method": "POST",
//    "mode": "cors",
//    "credentials": "omit"
//  }); --> {
//      "rows": [
//          {
//              "supply": "10000000000.0000 RAMCORE",
//              "base": {
//                  "balance": "36576322197 RAM",
//                  "weight": "0.50000000000000000"
//              },
//              "quote": {
//                  "balance": "15198462.75494764 WAX",
//                  "weight": "0.50000000000000000"
//              }
//          }
//      ],
//      "more": false,
//      "next_key": ""
//  } == ( (1 x 36576322197*** / 15198462.75494764) x 0.9765 ) x 0.08175 ::: 192.114603937

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
                "account"           : 'eosio',
                "name"              : "buyrambytes",
                "authorization"     : [{
                    "actor"             : 'wam',
                    "permission"        : "newaccount"
                }],
                'data'              : {
                    "bytes"             : 129, // RAM RATE
                    "payer"             : 'wam',
                    "receiver"          : DATA['actor']
                },
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_reg_setland_yeomenwarder(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [
            /*!
            {
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
                'account'           : 'eosio',
                'name'              : 'buyram', 
                "authorization"     : [{
                    "actor"             : DATA['payer'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'payer' 				: DATA['payer'],
                    'receiver'              : DATA['actor'],
                    'quant' 				: '0.50000000 WAX',
                },
            }, 
            !*/ {
                "account"       : "yeomenwarder", 
                "name"          : "warder", 
                "authorization"     : [{
                    "actor"         	: 'yeomenwarder', 
                    "permission"    	: "guard"
                }], 
                'data'        : {
                    'message'           : DATA['message']
                }
            }, {
                'account'           : 'federation',
                'name'              : 'agreeterms', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "account"           : DATA['actor'],
                    "terms_hash"        : "e2e07b7d7ece0d5f95d0144b5886ff74272c9873d7dbbc79bc56f047098e43ad",
                    "terms_id"          : 1
                },
            }, {
                "account"           : "federation",
                "name"              : "setavatar",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "avatar_id"         : "2"
                }
            }, {
                "account"           : "federation",
                "name"              : "settag",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "tag"               : DATA['actor'].split('.wam')[0]
                }
            }, {
                'account'           : 'm.federation',
                'name'              : 'setland', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'], 
                    'land_id'           : DATA['landid']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        
        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transaction, transactions, /*! signatures : result.signatures !*/}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_reg_setland_yeomenwarder_SelfBuy(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
            /*!{
                'account'           : 'eosio',
                'name'              : 'buyram', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'payer' 				: DATA['actor'],
                    'receiver'              : DATA['actor'],
                    'quant' 				: '0.50000000 WAX',
                },
            },!*/ {
                "account"       : "yeomenwarder", 
                "name"          : "warder", 
                "authorization"     : [{
                    "actor"         	: 'yeomenwarder', 
                    "permission"    	: "guard"
                }], 
                'data'        : {
                    'message'           : DATA['message']
                }
            }, {
                'account'           : 'federation',
                'name'              : 'agreeterms', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "account"           : DATA['actor'],
                    "terms_hash"        : "e2e07b7d7ece0d5f95d0144b5886ff74272c9873d7dbbc79bc56f047098e43ad",
                    "terms_id"          : 1
                },
            }, {
                "account"           : "federation",
                "name"              : "setavatar",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "avatar_id"         : "2"
                }
            }, {
                "account"           : "federation",
                "name"              : "settag",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "tag"               : DATA['actor'].split('.wam')[0]
                }
            }, {
                'account'           : 'm.federation',
                'name'              : 'setland', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'], 
                    'land_id'           : DATA['landid']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transaction, transactions}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
  
}; 
async function packedtrx_reg_setland_yeomenwarder_FreeRam(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
                'account'           : 'eosio',
                'name'              : 'buyrambytes', 
                "authorization"     : [{
                    "actor"         	: 'yeomenwarder', 
                    "permission"    	: "guard"
                }],
                'data'              : {
                    'payer'             : 'yeomenwarder',
                    'receiver'          : DATA['actor'],
                    'bytes'             : 591,
                },
            }, {
                'account'           : 'federation',
                'name'              : 'agreeterms', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    "account"           : DATA['actor'],
                    "terms_hash"        : "e2e07b7d7ece0d5f95d0144b5886ff74272c9873d7dbbc79bc56f047098e43ad",
                    "terms_id"          : 1
                },
            }, {
                "account"           : "federation",
                "name"              : "setavatar",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "avatar_id"         : "2"
                }
            }, {
                "account"           : "federation",
                "name"              : "settag",
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "account"           : DATA['actor'],
                    "tag"               : DATA['actor'].split('.wam')[0]
                }
            }, {
                'account'           : 'm.federation',
                'name'              : 'setland', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'], 
                    'land_id'           : DATA['landid']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_setland_prv(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
                'account'           : 'm.federation',
                'name'              : 'setland', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'], 
                    'land_id'           : DATA['landid']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        
        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, signatures : result.signatures}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_settool(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'm.federation',
                'name'              : 'setbag', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'],
                    'items'             : DATA['toolid']
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

async function packedtrx_reg_settool_yeomenwarder(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
                'account'           : 'm.federation',
                'name'              : 'setbag', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'],
                    'items'             : DATA['toolid']
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
async function packedtrx_settool_prv(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
                'account'           : 'm.federation',
                'name'              : 'setbag', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'account'           : DATA['actor'],
                    'items'             : DATA['toolid']
                },
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        
        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, signatures : result.signatures}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_stakecpu(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('boost.wax');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('boost.wax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
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
        //  const abiObj        = await get_rawabi_and_abi('boost.wax');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('boost.wax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'delegatebw', 
                    "authorization"     : [{
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }],
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_unstakecpu(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
                {
                    'account'           : 'eosio',
                    'name'              : 'undelegatebw', 
                    "authorization"     : [{
                        "actor"             : DATA['actor'],
                        "permission"        : "active"
                    }],
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
            "authorization"     : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const freeBandwidth = await packedtrx_rentstakecpu_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions}); 
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
        "authorization"     : [{
            "actor"             : DATA['actor'],
            "permission"        : "active"
        }],
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        const freeBandwidth = await packedtrx_sendnft_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_sendnft_freeBandwidth(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('boost.wax');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('boost.wax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_freestake(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
//  [{
//    "account": "eosio",
//    "name": "claimgenesis",
//    "authorization": [
//      {
//        "actor": "stakebymywax",
//        "permission": "active"
//      }
//    ],
//    "data": {
//      "claimer": "stakebymywax"
//    }
//  }, {
//    "account": "eosio",
//    "name": "claimgbmvote",
//    "authorization": [
//      {
//        "actor": "stakebymywax",
//        "permission": "active"
//      }
//    ],
//    "data": {
//      "owner": "stakebymywax"
//    }
//  }]
async function packedtrx_refund(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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

async function packedtrx_stakeplanet_prv(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA); 

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"           : "greymassnoop", 
                "name"              : "noop", 
                "authorization"     : [{
                    "actor"             : DATA['payer'],  //  DATA['payer'], // payer
                    "permission"        : "active"
                }], 
                "data"              : null
            }, {
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
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const result        = await api.transact(transactions, { broadcast: false, sign: false });
        const abis          = await api.getTransactionAbis(transaction);
        const requiredKeys  = _privateKeys.map((privateKey) => PrivateKey.fromString(privateKey).getPublicKey().toString());
        
        result.signatures = await _signatureProvider.sign({
            chainId,
            requiredKeys,
            serializedTransaction: result.serializedTransaction,
            serializedContextFreeData: result.serializedContextFreeData,
            abis
        });
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, signatures : result.signatures}); 
        });
    } catch (err) {
        console.log('err is', err);
    }; 
  
}; 
async function packedtrx_reg_sell_push(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][0] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets', 
                'name'              : 'createoffer', 
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }], 
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket', 
                    'sender_asset_ids'      : [ DATA['toolid'][0] ],
                    'recipient_asset_ids'   : [], 
                    'memo'                  : 'sale'
                }
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][1] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets',
                'name'              : 'createoffer',
                'authorization'     :[{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket',
                    'sender_asset_ids'      : [ DATA['toolid'][1] ],
                    'recipient_asset_ids'   : [],
                    'memo'                  : 'sale'
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_reg_sell_push_freeBandwidth(DATA); 
        const freeRam       = await packedtrx_reg_sell_push_freeRam(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transaction, transactions, freeBandwidth, freeRam}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_reg_sell_push_freeBandwidth(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});

        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'res.pink',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"                 : 'res.pink',
                    "permission"            : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][0] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets', 
                'name'              : 'createoffer', 
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }], 
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket', 
                    'sender_asset_ids'      : [ DATA['toolid'][0] ],
                    'recipient_asset_ids'   : [], 
                    'memo'                  : 'sale'
                }
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][1] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets',
                'name'              : 'createoffer',
                'authorization'     :[{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket',
                    'sender_asset_ids'      : [ DATA['toolid'][1] ],
                    'recipient_asset_ids'   : [],
                    'memo'                  : 'sale'
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
async function packedtrx_reg_sell_push_freeRam(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});

        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"           : 'eosio',
                "name"              : "buyrambytes",
                "authorization"     : [{
                    "actor"                 : 'wam',
                    "permission"            : "newaccount"
                }],
                'data'              : {
                    "bytes"                 : 1536, 
                    "payer"                 : 'wam',
                    "receiver"              : DATA['actor']
                },
            }, {
                'account'           : 'res.pink',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"                 : 'res.pink',
                    "permission"            : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][0] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets', 
                'name'              : 'createoffer', 
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }], 
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket', 
                    'sender_asset_ids'      : [ DATA['toolid'][0] ],
                    'recipient_asset_ids'   : [], 
                    'memo'                  : 'sale'
                }
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'announcesale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'seller'                : DATA['actor'],
                    'asset_ids'             : [ DATA['toolid'][1] ],
                    'listing_price'         : '1.00000000 WAX',
                    'settlement_symbol'     : '8,WAX',
                    'maker_marketplace'     : '.'
                }
            }, {
                'account'           : 'atomicassets',
                'name'              : 'createoffer',
                'authorization'     :[{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'sender'                : DATA['actor'],
                    'recipient'             : 'atomicmarket',
                    'sender_asset_ids'      : [ DATA['toolid'][1] ],
                    'recipient_asset_ids'   : [],
                    'memo'                  : 'sale'
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

async function packedtrx_reg_sell_pull(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'atomicmarket',
                'name'              : 'cancelsale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'sale_id'               : DATA['toolid'][0]
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions); 
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await packedtrx_reg_sell_pull_freeBandwidth(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transaction, transactions, freeBandwidth}); 
        });
    } catch (err) {
        console.log('err is', err);
    }
}; 
async function packedtrx_reg_sell_pull_freeBandwidth(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //  const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //  api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});

        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'res.pink',
                'name'              : 'noop', 
                "authorization"     : [{
                    "actor"                 : 'res.pink',
                    "permission"            : "paybw"
                }],
                "data"              : null
            }, {
                'account'           : 'atomicmarket',
                'name'              : 'cancelsale',
                'authorization'     : [{
                    'actor'                 : DATA['actor'],
                    'permission'            : 'active'
                }],
                'data'              : {
                    'sale_id'               : DATA['toolid'][0]
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

//  GET RAM PRICE
//  fetch("https://wax.greymass.com/v1/chain/get_table_rows", {
//    "headers": {
//      "accept": "*/*",
//      "accept-language": "en-US,en;q=0.9",
//      "cache-control": "no-cache",
//      "content-type": "text/plain;charset=UTF-8",
//      "pragma": "no-cache",
//      "sec-fetch-dest": "empty",
//      "sec-fetch-mode": "cors",
//      "sec-fetch-site": "cross-site",
//      "sec-gpc": "1"
//    },
//    "referrer": "https://wax.bloks.io/",
//    "referrerPolicy": "strict-origin-when-cross-origin",
//    "body": "{\"json\":true,\"code\":\"eosio\",\"scope\":\"eosio\",\"table\":\"rammarket\",\"lower_bound\":\"\",\"upper_bound\":\"\",\"index_position\":1,\"key_type\":\"\",\"limit\":10,\"reverse\":false,\"show_payer\":false}",
//    "method": "POST",
//    "mode": "cors",
//    "credentials": "omit"
//  }); --> {
//      "rows": [
//          {
//              "supply": "10000000000.0000 RAMCORE",
//              "base": {
//                  "balance": "36576322197 RAM",
//                  "weight": "0.50000000000000000"
//              },
//              "quote": {
//                  "balance": "15198462.75494764 WAX",
//                  "weight": "0.50000000000000000"
//              }
//          }
//      ],
//      "more": false,
//      "next_key": ""
//  } == ( (1 x 36576322197*** / 15198462.75494764) x 0.9765 ) x 0.08175 ::: 192.114603937
































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