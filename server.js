const crypto                                = require('crypto');
const { Api, JsonRpc, Serialize, Numeric }  = require('eosjs');
const ecc                                   = require('eosjs-ecc');
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
app.use(express.json());


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

    // sign
    app.get("/sign", (req, res) => {
        //  sets the header of the response to the user and the type of response that you would be sending back
        //  var sig = ecc.sign(url.parse(req.url,true).query.act, url.parse(req.url,true).query.key); console.log(sig) 
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({
            'act' : url.parse(req.url,true).query.Str, 
            'sig' : [ecc.sign(url.parse(req.url,true).query.Str, url.parse(req.url,true).query.Prv)]
        }));
        res.end();
    });
    app.post("/sign", (req, res) => {
        //  sets the header of the response to the user and the type of response that you would be sending back
        //  var sig = ecc.sign(url.parse(req.url,true).query.act, url.parse(req.url,true).query.key); console.log(sig) 
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({
            'act' : req.body, 
            'sig' : [ecc.sign(Buffer.from( req.body['U8A'] ), req.body['Prv']).toString()]
        }));
        res.end();
    });
    app.post("/sign_sha256", (req, res) => {
        //  sets the header of the response to the user and the type of response that you would be sending back
        //  var sig = ecc.sign(url.parse(req.url,true).query.act, url.parse(req.url,true).query.key); console.log(sig) 
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({
            'act' : ecc.sha256(Buffer.from( req.body['U8A'] )), 
            'sig' : [ecc.signHash(ecc.sha256(Buffer.from( req.body['U8A'] )), req.body['Prv']).toString()]
        }));
        res.end();
    });
    
    //  app.post("/sign", (req, res) => {
    //      //  sets the header of the response to the user and the type of response that you would be sending back
    //      //  var sig = ecc.sign(url.parse(req.url,true).query.act, url.parse(req.url,true).query.key); console.log(sig) 
    //      res.setHeader('Content-Type', 'application/json');
    //      res.write(JSON.stringify({
    //          'act' : req.body, 
    //          'sig' : [ecc.sign(Buffer.from( req.body['U8A'] ), req.body['Prv'])]
    //      }));
    //      res.end();
    //  });
    //  buffer2hex

    // Public Key EOS Format to STD KEY
    app.get("/format", (req, res) => {
        var sp = new JsSignatureProvider(['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']); 
        var pub = Numeric.convertLegacyPublicKey(ecc.PrivateKey.fromString( url.parse(req.url,true).query.key ).toPublic().toString());
        //  sp.keys.set(pub, key);
        //  sp.availableKeys.push(pub);
        res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({
            'eos' : url.parse(req.url,true).query.eos, 
            'std' : pub
        }));
        res.end();
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

    // fw_packedtrx_mine API
    app.get("/fw_packedtrx_mine", (req, res) => {
        fw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_mine", (req, res) => {
        fw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // fw_packedtrx_crop API
    app.get("/fw_packedtrx_mbrs", (req, res) => {
        fw_packedtrx_mbrs({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_mbrs", (req, res) => {
        fw_packedtrx_mbrs({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fw_packedtrx_crop API
    app.get("/fw_packedtrx_crop", (req, res) => {
        fw_packedtrx_crop({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099660508001,1099660508002,1099660508003').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
            /*!
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424')
            */
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_crop", (req, res) => {
        fw_packedtrx_crop({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099660508001,1099660508002,1099660508003').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
            /*!
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424')
            */
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fw_packedtrx_anim API
    app.get("/fw_packedtrx_anim", (req, res) => {
        fw_packedtrx_anim({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_anim", (req, res) => {
        fw_packedtrx_anim({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fw_packedtrx_plot API
    app.get("/fw_packedtrx_plot", (req, res) => {
        fw_packedtrx_plot({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_plot", (req, res) => {
        fw_packedtrx_plot({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fw_packedtrx_reco API
    app.get("/fw_packedtrx_reco", (req, res) => {
        fw_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_reco", (req, res) => {
        fw_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // fw_packedtrx_repa API
    app.get("/fw_packedtrx_repa", (req, res) => {
        fw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fw_packedtrx_repa", (req, res) => {
        fw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099584547424'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // gx_packedtrx_mine API
    app.get("/gx_packedtrx_mine", (req, res) => {
        gx_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868'), 
            'img'               : (url.parse(req.url,true).query.img                            || 'QmR9NQTfKRtCrhAyVm4UZtimPABQVnXcJW49VcmLmPqiWv')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/gx_packedtrx_mine", (req, res) => {
        gx_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868'), 
            'img'               : (url.parse(req.url,true).query.img                            || 'QmR9NQTfKRtCrhAyVm4UZtimPABQVnXcJW49VcmLmPqiWv')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // gx_packedtrx_reco API
    app.get("/gx_packedtrx_reco", (req, res) => {
        gx_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/gx_packedtrx_reco", (req, res) => {
        gx_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // gx_packedtrx_repa API
    app.get("/gx_packedtrx_repa", (req, res) => {
        gx_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/gx_packedtrx_repa", (req, res) => {
        gx_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // bl_packedtrx_mine API
    app.get("/bl_packedtrx_mine", (req, res) => {
        bl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'slot'              : (url.parse(req.url,true).query.slot                           || 1)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bl_packedtrx_mine", (req, res) => {
        bl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'slot'              : (url.parse(req.url,true).query.slot                           || 1)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // bl_packedtrx_heal API
    app.get("/bl_packedtrx_heal", (req, res) => {
        bl_packedtrx_heal({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'brawler'           : (url.parse(req.url,true).query.brawler                        || '1099628296388-1.0000')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bl_packedtrx_heal", (req, res) => {
        bl_packedtrx_heal({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'brawler'           : (url.parse(req.url,true).query.brawler                        || '1099628296388-1.0000')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // bl_packedtrx_swap API
    app.get("/bl_packedtrx_swap", (req, res) => {
        bl_packedtrx_swap({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000-6-10,0000000000000-6-10,0000000000000-6-10').match(/\d{13,13}-\d{1,2}-\d{1,2}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bl_packedtrx_swap", (req, res) => {
        bl_packedtrx_swap({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000-6-10,0000000000000-6-10,0000000000000-6-10').match(/\d{13,13}-\d{1,2}-\d{1,2}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // af_packedtrx_mine API
    app.get("/af_packedtrx_mine", (req, res) => {
        af_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/af_packedtrx_mine", (req, res) => {
        af_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099654395868'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // af_packedtrx_work API
    app.get("/af_packedtrx_work", (req, res) => {
        af_packedtrx_work({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'message'           : (url.parse(req.url,true).query.message                        || '0-0').match(/\d{1,13}-\d{1,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/af_packedtrx_work", (req, res) => {
        af_packedtrx_work({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'message'           : (url.parse(req.url,true).query.message                        || '0-0').match(/\d{1,13}-\d{1,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // af_packedtrx_reco API
    app.get("/af_packedtrx_reco", (req, res) => {
        af_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/af_packedtrx_reco", (req, res) => {
        af_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // af_packedtrx_repa API
    app.get("/af_packedtrx_repa", (req, res) => {
        af_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/af_packedtrx_repa", (req, res) => {
        af_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });





    
    
    // sr_packedtrx_mine API
    app.get("/sr_packedtrx_mine", (req, res) => {
        sr_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/sr_packedtrx_mine", (req, res) => {
        sr_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // sr_packedtrx_amul API
    app.get("/sr_packedtrx_amul", (req, res) => {
        sr_packedtrx_amul({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/sr_packedtrx_amul", (req, res) => {
        sr_packedtrx_amul({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // sr_packedtrx_reco API
    app.get("/sr_packedtrx_reco", (req, res) => {
        sr_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/sr_packedtrx_reco", (req, res) => {
        sr_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || 5), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // sr_packedtrx_repa API
    app.get("/sr_packedtrx_repa", (req, res) => {
        sr_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/sr_packedtrx_repa", (req, res) => {
        sr_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // sr_packedtrx_repa API
    app.get("/sr_packedtrx_land", (req, res) => {
        sr_packedtrx_land({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/sr_packedtrx_land", (req, res) => {
        sr_packedtrx_land({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // dw_packedtrx_mine API
    app.get("/dw_packedtrx_mine", (req, res) => {
        dw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000-1').match(/\d{13,13}-\d{1,1}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/dw_packedtrx_mine", (req, res) => {
        dw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000-1').match(/\d{13,13}-\d{1,1}/gi), 
            'time'              : (url.parse(req.url,true).query.time                           || 1), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // dw_packedtrx_mine API
    app.get("/dw_packedtrx_reve", (req, res) => {
        dw_packedtrx_reve({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/dw_packedtrx_reve", (req, res) => {
        dw_packedtrx_reve({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // sr_packedtrx_repa API
    app.get("/dw_packedtrx_repa", (req, res) => {
        dw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/dw_packedtrx_repa", (req, res) => {
        dw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fl_packedtrx_mine API
    app.get("/fl_packedtrx_mine", (req, res) => {
        fl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_mine", (req, res) => {
        fl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fl_packedtrx_pass API
    app.get("/fl_packedtrx_pass", (req, res) => {
        fl_packedtrx_pass({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_pass", (req, res) => {
        fl_packedtrx_pass({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fl_packedtrx_faps API
    app.get("/fl_packedtrx_faps", (req, res) => {
        fl_packedtrx_faps({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_faps", (req, res) => {
        fl_packedtrx_faps({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472-1099749456304-0').match(/\d{13,13}-\d{13,13}-\d{1,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fl_packedtrx_bait API
    app.get("/fl_packedtrx_bait", (req, res) => {
        fl_packedtrx_bait({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1000-1').match(/\d{4,4}-\d{1,3}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_bait", (req, res) => {
        fl_packedtrx_bait({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1000-1').match(/\d{4,4}-\d{1,3}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fl_packedtrx_craft_bait API
    app.get("/fl_packedtrx_craft_bait", (req, res) => {
        fl_packedtrx_craft_bait({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1-1000').match(/\d{1,3}-\d{4,4}/gi),
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_craft_bait", (req, res) => {
        fl_packedtrx_craft_bait({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1-1000').match(/\d{1,3}-\d{4,4}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // fl_packedtrx_repa API
    app.get("/fl_packedtrx_repa", (req, res) => {
        fl_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fl_packedtrx_repa", (req, res) => {
        fl_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // fwar_packedtrx_mine API
    app.get("/fwar_packedtrx_mine", (req, res) => {
        fwar_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fwar_packedtrx_mine", (req, res) => {
        fwar_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '1099784856472').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // fwar_packedtrx_repa API
    app.get("/fwar_packedtrx_repa", (req, res) => {
        fwar_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/fwar_packedtrx_repa", (req, res) => {
        fwar_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // vl_packedtrx_mine API
    app.get("/vl_packedtrx_mine", (req, res) => {
        vl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/vl_packedtrx_mine", (req, res) => {
        vl_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // df_packedtrx_mine API
    app.get("/df_packedtrx_mine", (req, res) => {
        df_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/df_packedtrx_mine", (req, res) => {
        df_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });






    
    // bw_packedtrx_mine API
    app.get("/bw_packedtrx_mine", (req, res) => {
        bw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bw_packedtrx_mine", (req, res) => {
        bw_packedtrx_mine({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000').match(/\d{13,13}/gi), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // bw_packedtrx_reco API
    app.get("/bw_packedtrx_reco", (req, res) => {
        bw_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || "10.0000 BZWB"), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bw_packedtrx_reco", (req, res) => {
        bw_packedtrx_reco({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'amount'            : (url.parse(req.url,true).query.amount                         || "10.0000 BZWB"), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // bw_packedtrx_repa API
    app.get("/bw_packedtrx_repa", (req, res) => {
        bw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/bw_packedtrx_repa", (req, res) => {
        bw_packedtrx_repa({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || '435yo.wam'), 
            'asset_id'          : (url.parse(req.url,true).query.asset_id                       || '0000000000000'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || ''), 
            'payer'             : (url.parse(req.url,true).query.payer                          || '')
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
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_private_key_greymass API
    app.get("/packedtrx_private_key_greymass", (req, res) => {
        packedtrx_private_key_greymass({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key_greymass", (req, res) => {
        packedtrx_private_key_greymass({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_private_key_pink API
    app.get("/packedtrx_private_key_pink", (req, res) => {
        packedtrx_private_key_pink({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key_pink", (req, res) => {
        packedtrx_private_key_pink({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });

    // packedtrx_private_key_dragonvalley API
    app.get("/packedtrx_private_key_dragonvalley", (req, res) => {
        packedtrx_private_key_dragonvalley({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key_dragonvalley", (req, res) => {
        packedtrx_private_key_dragonvalley({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_private_key_yeomen API
    app.get("/packedtrx_private_key_yeomen", (req, res) => {
        packedtrx_private_key_yeomen({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key_yeomen", (req, res) => {
        packedtrx_private_key_yeomen({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_private_key_auth API
    app.get("/packedtrx_private_key_auth", (req, res) => {
        packedtrx_private_key_auth({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_private_key_auth", (req, res) => {
        packedtrx_private_key_auth({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'nonce'             : (url.parse(req.url,true).query.nonce                          || '543B189423D6B4BF'), 
            'privateKey'        : (url.parse(req.url,true).query.privateKey                     || '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'), 
            'payer'             : (url.parse(req.url,true).query.payer                          || 'stakebymywax')
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
    
    // packedtrx_ss_launch API
    app.get("/packedtrx_ss_return", (req, res) => {
        packedtrx_ss_return({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'shipid'            : (url.parse(req.url,true).query.shipid                         || '7062').match(/\d{1,8}/gi).join('')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_ss_return", (req, res) => {
        packedtrx_ss_return({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'shipid'            : (url.parse(req.url,true).query.shipid                         || '7062').match(/\d{1,8}/gi).join('')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_ss_launch API
    app.get("/packedtrx_ss_launch", (req, res) => {
        //  console.log( url.parse(req.url,true).query.shipid )
        packedtrx_ss_launch({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'shipid'            : (url.parse(req.url,true).query.shipid                         || '7062-55356,7063-55356,7064-55356').match(/\d{1,8}-\d{1,8}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_ss_launch", (req, res) => {
        //  console.log( url.parse(req.url,true).query.shipid )
        packedtrx_ss_launch({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'shipid'            : (url.parse(req.url,true).query.shipid                         || '7062-55356,7063-55356,7064-55356').match(/\d{1,8}-\d{1,8}/gi)
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_kq_login API
    app.get("/packedtrx_kq_login", (req, res) => {
        packedtrx_kq_login({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'sign'              : (url.parse(req.url,true).query.sign                           || '5322109341739682068')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_kq_login", (req, res) => {
        packedtrx_kq_login({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'sign'              : (url.parse(req.url,true).query.sign                           || '5322109341739682068')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    
    // packedtrx_cc_login API
    app.get("/packedtrx_cc_login", (req, res) => {
        packedtrx_cc_login({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'sign'              : (url.parse(req.url,true).query.sign                           || '5322109341739682068')
        }).then(result => {
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(result))
            res.end();
        }); 
    });
    app.post("/packedtrx_cc_login", (req, res) => {
        packedtrx_cc_login({
            'chainId'           : (url.parse(req.url,true).query.chainId                        || '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4'), 
            'expiration'        : (url.parse(req.url,true).query.expiration                     || '2021-06-29T03:14:42.000'), 
            'block_num_or_id'   : (url.parse(req.url,true).query.block_num_or_id                || '126988588-1677423057'), 
            'actor'             : (url.parse(req.url,true).query.actor                          || 'w5fes.wam'), 
            'sign'              : (url.parse(req.url,true).query.sign                           || '5322109341739682068')
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
//  const endpoint      = 'https://api.wax.alohaeos.com'; 
//  const endpoint      = 'https://chain.wax.io'; 
const endpoint      = 'https://wax.pink.gg'; 
//  const endpoint      = 'https://wax.greymass.com'; 
const rpc           = new JsonRpc(endpoint, { fetch }); 

//  function buffer2hex (buffer) {
//    Array.from(buffer, (x: number) => ('00' + x.toString(16)).slice(-2)).join('')
//  }; 

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
        //    const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [
            //    {
            //        "account"         : "thematrixone", 
            //        "name"            : "guard", 
            //        "authorization"   : [{
            //            "actor"           : DATA['actor'],
            //            "permission"      : "active"
            //        }],
            //        "data"            : {
            //            "contract"        : "alien.worlds", 
            //            "user"            : "alien.worlds", 
            //            "value"           : `${(Math.random() * (1.120 - 0.0200) + 0.0200).toFixed(4)} TLM`
            //        }
            //    }, 
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
async function fw_packedtrx_mine(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "farmersworld", 
            "name"            : "claim", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "asset_id"          : DATA['asset_id'],
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      
      if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
          const privaKeysAuth = await fw_packedtrx_mine_private_key_auth(DATA); 
          return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
          }); 
      }else{
          const freeBandwidth = await fw_packedtrx_mine_free_trx(DATA); 
          return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
          }); 
      }; 
      
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function fw_packedtrx_mine_free_trx(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "boost.wax", 
            "name"            : "noop", 
            "authorization"   : [{
                "actor"             : "farmersworld",
                "permission"        : "paybw"
            }],
            "data"            : null
        }, {
            "account"         : "farmersworld", 
            "name"            : "claim", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "asset_id"          : DATA['asset_id'],
            }
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
  }; 

}; 
async function fw_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "farmersworld", 
                "name"            : "claim", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], // Actor
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "asset_id"          : DATA['asset_id'],
                }
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
async function fw_packedtrx_mbrs(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "farmersworld", 
            "name"            : "mbsclaim", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "asset_id"          : DATA['asset_id'],
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      
      if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
          const privaKeysAuth = await fw_packedtrx_mbrs_private_key_auth(DATA); 
          return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
          }); 
      }else{
          const freeBandwidth = await fw_packedtrx_mbrs_free_trx(DATA); 
          return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
          }); 
      }; 
      
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function fw_packedtrx_mbrs_free_trx(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "boost.wax", 
            "name"            : "noop", 
            "authorization"   : [{
                "actor"             : "farmersworld",
                "permission"        : "paybw"
            }],
            "data"            : null
        }, {
            "account"         : "farmersworld", 
            "name"            : "mbsclaim", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "asset_id"          : DATA['asset_id']
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
async function fw_packedtrx_mbrs_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "farmersworld", 
                "name"            : "mbsclaim", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],// Actor
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "asset_id"          : DATA['asset_id']
                }
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
async function fw_packedtrx_crop(DATA){
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function makedb(d) {
                var data = []; 
                for ( i of d['asset_id'] ){
            	    data.push({
                        "account"         : "farmersworld", 
                        "name"            : "cropclaim", 
                        "authorization"   : [{
                            "actor"             : d['actor'],
                            "permission"        : "active"
                        }],
                        "data"            : {
                            "owner"             : d['actor'],
                            "crop_id"           : i,
                        }
                    })
            	}; 
            	return data;
            })( DATA )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
      
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fw_packedtrx_crop_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await fw_packedtrx_crop_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
            }); 
        }; 
      
    } catch (err) {
          console.log('err is', err);
    }; 

}; 
async function fw_packedtrx_crop_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": (function makedb(d) {
                var data = []; 
                for ( i of d['asset_id'] ){
            	    data.push({
                        "account"         : "farmersworld", 
                        "name"            : "cropclaim", 
                        "authorization"   : [{
                            "actor"             : d['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : d['actor'],
                            "permission"        : "active"
                        }],
                        "data"            : {
                            "owner"             : d['actor'],
                            "crop_id"           : i,
                        }
                    })
            	}; 
            	return data;
            })( DATA )
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
async function fw_packedtrx_anim(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
          "expiration"        : DATA['expiration'],
          "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
          "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
          "actions": [{
                "account"         : "farmersworld", 
                "name"            : "anmclaim", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "animal_id"         : DATA['asset_id'],
                }
          }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
      
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fw_packedtrx_anim_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await fw_packedtrx_crop_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
            }); 
        }; 
      
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function fw_packedtrx_anim_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                  "account"         : "farmersworld", 
                  "name"            : "anmclaim", 
                  "authorization"   : [{
                      "actor"             : DATA['payer'],
                      "permission"        : "active"
                  }, {
                      "actor"             : DATA['actor'],
                      "permission"        : "active"
                  }],
                  "data"            : {
                      "owner"             : DATA['actor'],
                      "animal_id"         : DATA['asset_id'],
                  }
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
async function fw_packedtrx_plot(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "farmersworld", 
            "name"            : "bldclaim", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "asset_id"          : DATA['asset_id'],
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      
      if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
          const privaKeysAuth = await fw_packedtrx_plot_private_key_auth(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
          }); 
      }else{
          //    const freeBandwidth = await fw_packedtrx_crop_free_trx(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
          }); 
      }; 
      
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function fw_packedtrx_plot_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "farmersworld", 
                "name"            : "bldclaim", 
                "authorization"   : [{
                    "actor"             : DATA['payer'],
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "asset_id"          : DATA['asset_id'],
                }
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
async function fw_packedtrx_repa(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "farmersworld", 
            "name"            : "repair", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "asset_owner"       : DATA['actor'],
                "asset_id"          : DATA['asset_id'],
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      
      if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
          const privaKeysAuth = await fw_packedtrx_repa_private_key_auth(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
          }); 
      }else{
          //    const freeBandwidth = await fw_packedtrx_crop_free_trx(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
          }); 
      }; 
      
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function fw_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "farmersworld", 
                "name"            : "repair", 
                "authorization"   : [{
                    "actor"             : DATA['payer'],
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "asset_owner"       : DATA['actor'],
                    "asset_id"          : DATA['asset_id'],
                }
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
async function fw_packedtrx_reco(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('farmersworld');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "farmersworld", 
            "name"            : "recover", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "energy_recovered"  : parseInt(DATA['amount']),
            }
        }]
      }; 
      
      const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
      const serial        = api.serializeTransaction(transactions);
      const packed_trx    = arrayToHex(serial); 
      
      if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
          const privaKeysAuth = await fw_packedtrx_reco_private_key_auth(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
          }); 
      }else{
          //    const freeBandwidth = await fw_packedtrx_crop_free_trx(DATA); 
          return new Promise(function(resolve, reject) {
              resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
          }); 
      }; 
      
  } catch (err) {
      console.log('err is', err);
  }; 

}; 
async function fw_packedtrx_reco_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmersworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmersworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
            "account"         : "farmersworld", 
            "name"            : "recover", 
            "authorization"   : [{
                "actor"             : DATA['payer'],
                "permission"        : "active"
            }, {
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "energy_recovered"  : parseInt(DATA['amount']),
            }
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
async function gx_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "galaxyminers", 
                "name"            : "claim", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "asset_owner"       : DATA['actor'],
                    "asset_id"          : DATA['asset_id'],
                    "img"               : DATA['img']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await gx_packedtrx_mine_free_trx(DATA); 
    
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function gx_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "galaxyminers",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }, {
                "account"         : "galaxyminers", 
                "name"            : "claim", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "asset_owner"       : DATA['actor'],
                    "asset_id"          : DATA['asset_id'],
                    "img"               : DATA['img']
                }
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
    }; 

}; 
async function gx_packedtrx_repa(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "galaxyminers", 
            "name"            : "repair", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "asset_owner"       : DATA['actor'],
                "asset_id"          : DATA['asset_id']
            }
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
  }; 

}; 
async function gx_packedtrx_reco(DATA){

  console.log(DATA)

  try {
      const chainId       = DATA['chainId'];
      //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
      const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
      //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
      const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions": [{
            "account"         : "galaxyminers", 
            "name"            : "recover", 
            "authorization"   : [{
                "actor"             : DATA['actor'],
                "permission"        : "active"
            }],
            "data"            : {
                "owner"             : DATA['actor'],
                "energy_recovered"  : parseInt(DATA['amount']),
            }
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
  }; 

}; 
async function packedtrx_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('yeomenwarder');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"           : "yeomenwarder", 
                "name"              : "warder", 
                "authorization"     : [{
		            "actor"         	: 'yeomenwarder', 
		            "permission"    	: "guard"
                }], 
                "data"          : {
                    "message"           : DATA['message']
                }
            }, {
                "account"           : "m.federation", 
                "name"              : "mine", 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"              : {
                    "miner"             : DATA['actor'], // wax.userAccount
                    "nonce"             : DATA['nonce']
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
async function bl_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "bcbrawlers", 
                "name"            : "brawl", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "slot_id"           : parseInt(DATA['slot'])
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await bl_packedtrx_mine_free_trx(DATA); 
    
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function bl_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }, {
                "account"         : "bcbrawlers", 
                "name"            : "brawl", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "slot_id"           : DATA['slot']
                }
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
    }; 

}; 
async function bl_packedtrx_heal(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "bcbrawlers", 
                "name"            : "heal", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "brawler_id"        : `${ DATA['brawler'].split('-')[0] }`, 
                    "amount"            : `${ DATA['brawler'].split('-')[1] } BRWL`
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await bl_packedtrx_heal_free_trx(DATA); 
    
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function bl_packedtrx_heal_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }, {
                "account"         : "bcbrawlers", 
                "name"            : "brawl", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "brawler_id"        : `${ DATA['brawler'].split('-')[0] }`, 
                    "amount"            : `${ DATA['brawler'].split('-')[1] } BRWL`
                }
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
    }; 

}; 
async function bl_packedtrx_swap(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "bcbrawlers", 
                        "name"              : "brawlerrem", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'],
                            "slot_id"           : x.split('-')[1],
                            "brawler_id"        : x.split('-')[0]
                        },
                    }); 
                    data['val'].push({
                        "account"           : "bcbrawlers", 
                        "name"              : "brawleradd", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'],
                            "slot_id"           : x.split('-')[2],
                            "brawler_id"        : x.split('-')[0]
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        const freeBandwidth = await bl_packedtrx_swap_free_trx(DATA); 
    
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function bl_packedtrx_swap_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "bcbrawlers", 
                            "name"              : "brawlerrem", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'],
                                "slot_id"           : x.split('-')[1],
                                "brawler_id"        : x.split('-')[0]
                            },
                        }); 
                        data['val'].push({
                            "account"           : "bcbrawlers", 
                            "name"              : "brawleradd", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'],
                                "slot_id"           : x.split('-')[2],
                                "brawler_id"        : x.split('-')[0]
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id'].split(',')) {
                    data['val'].push({
                        "account"           : "ageoffarming", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "user"              : data['actor'],
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await af_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await af_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id'].split(',')) {
                        data['val'].push({
                            "account"           : "ageoffarming", 
                            "name"              : "claim", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "user"              : data['actor'],
                                "asset_id"          : x
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id'].split(',')) {
                    data['val'].push({
                        "account"           : "ageoffarming", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "user"              : data['actor'],
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
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
async function af_packedtrx_work(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (let x = 0; x < data['asset_id'].length; x++) {
                    data['val'].push({
                        "account"           : "ageoffarming", 
                        "name"              : "work", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "user"              : data['actor'],
                            "asset_ids"         : [ data['asset_id'][x] ], 
                            'dog'               : (function (d, t){
                                try{ return parseInt(d[t].split('-')[0]) }catch(e){ return 0 }
                            })( data['message'], x ), 
                            'clothing'          : (function (d, t){
                                try{ return parseInt(d[t].split('-')[1]) }catch(e){ return 0 }
                            })( data['message'], x ), 
                            "time"              : parseInt(data['time'])
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await af_packedtrx_work_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await af_packedtrx_work_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_work_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (let x = 0; x < data['asset_id'].length; x++) {
                        data['val'].push({
                            "account"           : "ageoffarming", 
                            "name"              : "work", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "user"              : data['actor'],
                                "asset_ids"         : [ data['asset_id'][x] ], 
                                'dog'               : (function (d, t){
                                    try{ return parseInt(d[t].split('-')[0]) }catch(e){ return 0 }
                                })( data['message'], x ), 
                                'clothing'          : (function (d, t){
                                    try{ return parseInt(d[t].split('-')[1]) }catch(e){ return 0 }
                                })( data['message'], x ), 
                                "time"              : parseInt(data['time'])
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_work_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (let x = 0; x < data['asset_id'].length; x++) {
                    data['val'].push({
                        "account"           : "ageoffarming", 
                        "name"              : "work", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "user"              : data['actor'],
                            "asset_ids"         : [ data['asset_id'][x] ], 
                            'dog'               : (function (d, t){
                                try{ return parseInt(d[t].split('-')[0]) }catch(e){ return 0 }
                            })( data['message'], x ), 
                            'clothing'          : (function (d, t){
                                try{ return parseInt(d[t].split('-')[1]) }catch(e){ return 0 }
                            })( data['message'], x ), 
                            "time"              : parseInt(data['time'])
                        },
                    })
                }; return data['val']; 
            })(DATA)
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
async function af_packedtrx_repa(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "ageoffarming", 
                "name"            : "repair", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "user"              : DATA['actor'],
                    "asset_ids"         : DATA['asset_id']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await af_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await af_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "ageoffarming", 
                "name"            : "repair", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "user"              : DATA['actor'],
                    "asset_ids"         : DATA['asset_id']
                }
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
async function af_packedtrx_reco(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('galaxyminers');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('galaxyminers', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "ageoffarming", 
                "name"            : "buyenergy", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "user"             : DATA['actor'],
                    "food"             : parseInt(DATA['amount']),
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await af_packedtrx_reco_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await af_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 

}; 
async function af_packedtrx_reco_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('ageoffarming');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('ageoffarming', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "ageoffarming", 
                "name"            : "buyenergy", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "user"             : DATA['actor'],
                    "food"             : parseInt(DATA['amount']),
                }
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
async function sr_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "saarofficial", 
                        "name"              : "claimyeti", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "account"           : data['actor'],
                            "asset_id"          : x,
                            "time_factor"       : parseInt(data['time'])
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await sr_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await sr_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "saarofficial", 
                            "name"              : "claimyeti", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "account"           : data['actor'],
                                "asset_id"          : x,
                                "time_factor"       : parseInt(data['time'])
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "saarofficial", 
                        "name"              : "claimyeti", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "account"           : data['actor'],
                            "asset_id"          : x,
                            "time_factor"       : parseInt(data['time'])
                        },
                    })
                }; return data['val']; 
            })(DATA)
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
async function sr_packedtrx_amul(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "saarofficial", 
                        "name"              : "claimamlt", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "account"           : data['actor'],
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await sr_packedtrx_amul_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await sr_packedtrx_amul_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_amul_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "saarofficial", 
                            "name"              : "claimamlt", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "account"           : data['actor'],
                                "asset_id"          : x
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_amul_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "saarofficial", 
                        "name"              : "claimamlt", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "account"           : data['actor'],
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
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
async function sr_packedtrx_repa(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "saarofficial", 
                "name"            : "repairyeti", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"           : DATA['actor'],
                    "asset_id"          : DATA['asset_id']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await sr_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await sr_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "saarofficial", 
                "name"            : "repairyeti", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"           : DATA['actor'],
                    "asset_id"          : DATA['asset_id']
                }
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
async function sr_packedtrx_reco(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "saarofficial", 
                "name"            : "renewstamina", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"             : DATA['actor'],
                    "stamina_to_restore"  : parseInt(DATA['amount'])
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await sr_packedtrx_reco_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await sr_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_reco_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "saarofficial", 
                "name"            : "renewstamina", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"             : DATA['actor'],
                    "stamina_to_restore"  : parseInt(DATA['amount'])
                }
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
async function sr_packedtrx_land(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "saarofficial", 
                "name"            : "selectland", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"           : DATA['actor'],
                    "land_id"           : DATA['asset_id']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await sr_packedtrx_land_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await sr_packedtrx_land_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function sr_packedtrx_land_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }, {
                "account"         : "saarofficial", 
                "name"            : "selectland", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"           : DATA['actor'],
                    "land_id"           : DATA['asset_id']
                }
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
    }; 
}; 
async function sr_packedtrx_land_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "saarofficial", 
                "name"            : "selectland", 
                "authorization"   : [{
                    "actor"             : data['payer'],
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"           : DATA['actor'],
                    "land_id"           : DATA['asset_id']
                }
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

async function dw_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if (
                        x.split('-')[1] == 1 || x.split('-')[1] == '1'
                    ){
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "safemine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0]
                            },
                        })
                    } else if (
                        x.split('-')[1] == 2 || x.split('-')[1] == '2'
                    ){
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "unsafemine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0],
                                "risky"             : true,
                                "signing_value"     : 0
                            },
                        }); 
                    }else{
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "unsafemine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0],
                                "risky"             : false,
                                "signing_value"     : 0
                            },
                        }); 
                    }
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await dw_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await dw_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function dw_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        if (
                            x.split('-')[1] == 1 || x.split('-')[1] == '1'
                        ){
                            data['val'].push({
                                "account"           : "diggerswgame", 
                                "name"              : "safemine", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "asset_owner"       : data['actor'],
                                    "asset_id"          : x.split('-')[0]
                                },
                            })
                        } else if (
                            x.split('-')[1] == 2 || x.split('-')[1] == '2'
                        ){
                            data['val'].push({
                                "account"           : "diggerswgame", 
                                "name"              : "unsafemine", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "asset_owner"       : data['actor'],
                                    "asset_id"          : x.split('-')[0],
                                    "risky"             : true,
                                    "signing_value"     : 0
                                },
                            }); 
                        }else{
                            data['val'].push({
                                "account"           : "diggerswgame", 
                                "name"              : "unsafemine", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "asset_owner"       : data['actor'],
                                    "asset_id"          : x.split('-')[0],
                                    "risky"             : false,
                                    "signing_value"     : 0
                                },
                            }); 
                        }
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function dw_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if (
                        x.split('-')[1] == 1 || x.split('-')[1] == '1'
                    ){
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "safemine", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0]
                            },
                        })
                    } else if (
                        x.split('-')[1] == 2 || x.split('-')[1] == '2'
                    ){
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "unsafemine", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0],
                                "risky"             : true,
                                "signing_value"     : 0
                            },
                        }); 
                    }else{
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "unsafemine", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x.split('-')[0],
                                "risky"             : false,
                                "signing_value"     : 0
                            },
                        }); 
                    }
                }; return data['val']; 
            })(DATA)
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

async function dw_packedtrx_reve(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "diggerswgame", 
                        "name"              : "revealresult", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "asset_owner"       : data['actor'],
                            "asset_id"          : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await dw_packedtrx_reve_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await dw_packedtrx_reve_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function dw_packedtrx_reve_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "diggerswgame", 
                            "name"              : "revealresult", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "asset_owner"       : data['actor'],
                                "asset_id"          : x
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function dw_packedtrx_reve_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('saarofficial');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('saarofficial', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "diggerswgame", 
                        "name"              : "revealresult", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "asset_owner"       : data['actor'],
                            "asset_id"          : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
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

async function dw_packedtrx_repa(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "diggerswgame", 
                "name"            : "trepair", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "asset_owner"       : DATA['actor'],
                    "asset_id"          : DATA['asset_id']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await dw_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await dw_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function dw_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('diggerswgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('diggerswgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "diggerswgame", 
                "name"            : "trepair", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "asset_owner"       : DATA['actor'],
                    "asset_id"          : DATA['asset_id']
                }
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

async function fl_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if(data['val'] == []){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        if(data['val'] == []){
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishing", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : x.split('-')[2]
                                },
                            })
                        }else{
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishing", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : '0'
                                },
                            })
                        }; 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if(data['val'] == []){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 
                }; return data['val']; 
            })(DATA)
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
async function fl_packedtrx_pass(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if(data['val'].length == 0){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_pass_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_pass_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_pass_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        if(data['val'].length == 0){
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishing", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : x.split('-')[2]
                                },
                            })
                        }else{
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishing", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : '0'
                                },
                            })
                        }; 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_pass_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if(data['val'].length == 0){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                                "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishing", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 


                    
                }; return data['val']; 
            })(DATA)
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

async function fl_packedtrx_faps(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    if(data['val'].length == 0){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishingall", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishingall", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_faps_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_faps_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_faps_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                         if(data['val'].length == 0){
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishingall", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : x.split('-')[2]
                                },
                            })
                        }else{
                            data['val'].push({
                                "account"           : "fishinglgame", 
                                "name"              : "fishingall", 
                                "authorization"     : [{
                                    "actor"             : data['actor'],
                                    "permission"        : "active"
                                }],
                                'data'              : {
                                    "fishername"         : data['actor'], 
                                    "asset_id"           : x.split('-')[0], 
                                    "fisher_id"          : x.split('-')[1], 
                                    "bonus_asset_id"     : '0'
                                },
                            })
                        }; 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_faps_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                     if(data['val'].length == 0){
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishingall", 
                                "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : x.split('-')[2]
                            },
                        })
                    }else{
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "fishingall", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "fishername"         : data['actor'], 
                                "asset_id"           : x.split('-')[0], 
                                "fisher_id"          : x.split('-')[1], 
                                "bonus_asset_id"     : '0'
                            },
                        })
                    }; 
                }; return data['val']; 
            })(DATA)
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

async function fl_packedtrx_bait(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "setbait", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "id"                : parseInt(x.split('-')[0]), 
                            "amount"            : parseInt(x.split('-')[1])
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_bait_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_bait_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_bait_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "setbait", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'], 
                                "id"                : parseInt(x.split('-')[0]), 
                                "amount"            : parseInt(x.split('-')[1])
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_bait_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "setbait", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "id"                : parseInt(x.split('-')[0]), 
                            "amount"            : parseInt(x.split('-')[1])
                        },
                    })
                }; return data['val']; 
            })(DATA)
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
async function fl_packedtrx_craft_bait(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "craftitem", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "template_id"       : parseInt(x.split('-')[1]), 
                            "amount"            : parseInt(x.split('-')[0])
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_craft_bait_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_craft_bait_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_craft_bait_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "craftitem", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'], 
                                "template_id"       : parseInt(x.split('-')[1]), 
                                "amount"            : parseInt(x.split('-')[0])
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_craft_bait_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "craftitem", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "template_id"       : parseInt(x.split('-')[1]), 
                            "amount"            : parseInt(x.split('-')[0])
                        },
                    })
                }; return data['val']; 
            })(DATA)
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

async function fl_packedtrx_repa(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "resetenegy", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fl_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fl_packedtrx_repa_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_repa_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "fishinglgame", 
                            "name"              : "resetenegy", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'], 
                                "asset_id"          : x
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fl_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "fishinglgame", 
                        "name"              : "resetenegy", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "asset_id"          : x
                        },
                    })
                }; return data['val']; 
            })(DATA)
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







async function fwar_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmwarsnfts');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmwarsnfts', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fwar_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fwar_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fwar_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmwarsnfts');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmwarsnfts', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "farmwarsnfts", 
                            "name"              : "claim", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "wallet"             : data['actor'], 
                                "building_id"        : x
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fwar_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
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
async function fwar_packedtrx_repa(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmwarsnfts');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmwarsnfts', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "repairtool", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "repairblding", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await fwar_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await fwar_packedtrx_repa_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fwar_packedtrx_repa_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('farmwarsnfts');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('farmwarsnfts', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "farmwarsnfts", 
                            "name"              : "repairtool", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "wallet"             : data['actor'], 
                                "building_id"        : x
                            },
                        }); 
                        data['val'].push({
                            "account"           : "farmwarsnfts", 
                            "name"              : "repairblding", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "wallet"             : data['actor'], 
                                "building_id"        : x
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function fwar_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('fishinglgame');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('fishinglgame', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "repairtool", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 
                    data['val'].push({
                        "account"           : "farmwarsnfts", 
                        "name"              : "repairblding", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "wallet"             : data['actor'], 
                            "building_id"        : x
                        },
                    }); 


                    
                }; return data['val']; 
            })(DATA)
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






async function vl_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('varialandsio');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('varialandsio', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of [data['actor']]) {
                    data['val'].push({
                        "account"           : "varialandsio", 
                        "name"              : "mine", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "miner"             : data['actor']
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await vl_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await vl_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function vl_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('varialandsio');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('varialandsio', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of [data['actor']]) {
                        data['val'].push({
                            "account"           : "varialandsio", 
                            "name"              : "mine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "miner"             : data['actor']
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function vl_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('varialandsio');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('varialandsio', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of [data['actor']]) {
                    data['val'].push({
                        "account"           : "varialandsio", 
                        "name"              : "mine", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "miner"             : data['actor']
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
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






async function df_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('desertfarmgm');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('desertfarmgm', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "desertfarmgm", 
                "name"            : "register", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "reference"         : 'stakebymywax'
                }
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of [data['actor']]) {
                        data['val'].push({
                            "account"           : "desertfarmgm", 
                            "name"              : "mine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor']
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await df_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await df_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function df_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('desertfarmgm');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('desertfarmgm', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }, {
                "account"         : "desertfarmgm", 
                "name"            : "register", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "reference"         : 'stakebymywax'
                }
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of [data['actor']]) {
                        data['val'].push({
                            "account"           : "desertfarmgm", 
                            "name"              : "mine", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor']
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function df_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('desertfarmgm');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('desertfarmgm', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "desertfarmgm", 
                "name"            : "register", 
                "authorization"   : [{
                    "actor"             : DATA['payer'],
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'], 
                    "reference"         : 'stakebymywax'
                }
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of [data['actor']]) {
                        data['val'].push({
                            "account"           : "desertfarmgm", 
                            "name"              : "mine", 
                            "authorization"     : [{
                                "actor"             : data['payer'],
                                "permission"        : "active"
                            }, {
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor']
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
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














async function bw_packedtrx_mine(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('burgerzworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('burgerzworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "burgerzworld", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "asset_id"          : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await bw_packedtrx_mine_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            const freeBandwidth = await bw_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, freeBandwidth}); 
            }); 
        }; 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function bw_packedtrx_mine_free_trx(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('desertfarmgm');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('desertfarmgm', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [{
                "account"         : "boost.wax", 
                "name"            : "noop", 
                "authorization"   : [{
                    "actor"             : "boost.wax",
                    "permission"        : "paybw"
                }],
                "data"            : null
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['asset_id']) {
                        data['val'].push({
                            "account"           : "burgerzworld", 
                            "name"              : "claim", 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                "owner"             : data['actor'], 
                                "asset_id"          : x
                            },
                        }); 
                    }; return data['val']; 
                })(DATA)
            )
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        return new Promise(function(resolve, reject) {
            resolve({packed_trx, serializedTransaction : serial, transactions, transaction}); 
        }); 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function bw_packedtrx_mine_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('desertfarmgm');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('desertfarmgm', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : (function (data){
                data['val'] = []; 
                for (const x of data['asset_id']) {
                    data['val'].push({
                        "account"           : "burgerzworld", 
                        "name"              : "claim", 
                        "authorization"     : [{
                            "actor"             : data['payer'],
                            "permission"        : "active"
                        }, {
                            "actor"             : data['actor'],
                            "permission"        : "active"
                        }],
                        'data'              : {
                            "owner"             : data['actor'], 
                            "asset_id"          : x
                        },
                    }); 
                }; return data['val']; 
            })(DATA)
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
async function bw_packedtrx_repa(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('burgerzworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('burgerzworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "burgerzworld", 
                "name"            : "repair.tool", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "tool_id"           : DATA['asset_id']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await bw_packedtrx_repa_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await bw_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function bw_packedtrx_repa_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('burgerzworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('burgerzworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "burgerzworld", 
                "name"            : "repair.tool", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "owner"             : DATA['actor'],
                    "tool_id"           : DATA['asset_id']
                }
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
async function bw_packedtrx_reco(DATA){

    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('burgerzworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('burgerzworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "burgerzworld", 
                "name"            : "charge", 
                "authorization"   : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"             : DATA['actor'],
                    "cost"                : DATA['amount']
                }
            }]
        }; 
        
        const transactions  = { ...transaction, actions: await api.serializeActions(transaction.actions) };
        const serial        = api.serializeTransaction(transactions);
        const packed_trx    = arrayToHex(serial); 
        
        if( DATA.hasOwnProperty('privateKey') && DATA['privateKey'] != '' ){
            const privaKeysAuth = await bw_packedtrx_reco_private_key_auth(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, privaKeysAuth}); 
            }); 
        }else{
            //    const freeBandwidth = await bw_packedtrx_mine_free_trx(DATA); 
            return new Promise(function(resolve, reject) {
                resolve({packed_trx, serializedTransaction : serial, transactions, transaction, /*! freeBandwidth !*/}); 
            }); 
        }; 
        
    } catch (err) {
        console.log('err is', err);
    }; 
}; 
async function bw_packedtrx_reco_private_key_auth(DATA){
    
    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA)
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('burgerzworld');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('burgerzworld', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                "account"         : "burgerzworld", 
                "name"            : "charge", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], 
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                "data"            : {
                    "account"             : DATA['actor'],
                    "cost"                : DATA['amount']
                }
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







async function packedtrx_private_key(DATA){

  const _privateKeys        = [ DATA['privateKey'] ]; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA); 

  try {
    const chainId       = DATA['chainId'];
    //    const abiObj        = await get_rawabi_and_abi('m.federation');
    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
    const transaction   = {
        "expiration"        : DATA['expiration'],
        "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
        "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
        "actions"           : [{
            "account"           : "boost.wax", 
            "name"              : "noop", 
            "authorization"     : [{
                "actor"             : DATA['payer'],  //  DATA['payer'], // payer
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
async function packedtrx_private_key_greymass(DATA){

  const _privateKeys        = [ DATA['privateKey'] ]; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA); 

  try {
    const chainId       = DATA['chainId'];
    //    const abiObj        = await get_rawabi_and_abi('m.federation');
    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
async function packedtrx_private_key_pink(DATA){

  const _privateKeys        = [ DATA['privateKey'] ]; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA); 

  try {
    const chainId       = DATA['chainId'];
    //    const abiObj        = await get_rawabi_and_abi('m.federation');
    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
    const transaction   = {
      "expiration"        : DATA['expiration'],
      "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
      "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
      "actions"           : [{
        "account"           : "res.pink", 
        "name"              : "noop", 
        "authorization"     : [{
            "actor"             : DATA['payer'],  //  DATA['payer'], // payer
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
async function packedtrx_private_key_dragonvalley(DATA){

  const _privateKeys        = [ DATA['privateKey'] ]; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA); 

  try {
    const chainId       = DATA['chainId'];
    //    const abiObj        = await get_rawabi_and_abi('m.federation');
    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
    const transaction   = {
      "expiration"        : DATA['expiration'],
      "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
      "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
      "actions"           : [{
        "account"           : "dragonvalley", 
        "name"              : "noop", 
        "authorization"     : [{
            "actor"             : DATA['payer'],  //  DATA['payer'], // payer
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
async function packedtrx_private_key_yeomen(DATA){

  const _privateKeys        = [ DATA['privateKey'] ]; 
  const _signatureProvider  = new JsSignatureProvider(_privateKeys); 

  console.log(DATA); 

  try {
    const chainId       = DATA['chainId'];
    //    const abiObj        = await get_rawabi_and_abi('m.federation');
    const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
    //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
    const transaction   = {
      "expiration"        : DATA['expiration'],
      "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
      "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
      "actions"           : [{
        "account"           : "yeomenwarder", 
        "name"              : "warder", 
        "authorization"     : [{
            "actor"             : DATA['payer'],  //  DATA['payer'], // payer
            "permission"        : "active"
        }], 
        "data"              : {
            "message"           : (function makeid(d) {
            	var head = d['s'][Math.floor(Math.random() * d['s'].length)]
            	var text = ""; for (var i = 0; i < head['text']; i++)
            	text += d['p'].charAt(Math.floor(Math.random() * d['p'].length));
            	return head['head'] + text;
            })({ 's' : [
            		{'head' : '3u2312', 'text' : 10}, 
            		{'head' : '3u2313', 'text' : 10}, 
            		{'head' : '17a5opsoprkx', 'text' : 6}, 
            		{'head' : '47rahokxmkxj0b', 'text' : 3}, 
            		{'head' : 'fgkkehukxj0b', 'text' : 3}
            	], 
            	'p' : "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz0123456789"
            })
        }
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
async function packedtrx_private_key_auth(DATA){

    const _privateKeys        = [ DATA['privateKey'] ]; 
    const _signatureProvider  = new JsSignatureProvider(_privateKeys); 
    
    console.log(DATA); 
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('m.federation');
        const api           = new Api({ rpc, _signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('m.federation', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions"           : [
            //    {
            //        "account"         : "thematrixone", 
            //        "name"            : "guard", 
            //        "authorization"   : [{
            //            "actor"             : DATA['payer'], // Actor
            //            "permission"        : "active"
            //        }, {
            //            "actor"             : DATA['actor'], // Actor
            //            "permission"        : "active"
            //        }],
            //        "data"            : {
            //            "contract"          : "alien.worlds", 
            //            "user"              : "alien.worlds", 
            //            "value"             : `${(Math.random() * (1.120 - 0.0200) + 0.0200).toFixed(4)} TLM`
            //        }
            //    }, 
            {
                "account"         : "m.federation", 
                "name"            : "mine", 
                "authorization"   : [{
                    "actor"             : DATA['payer'], // Actor
                    "permission"        : "active"
                }, {
                    "actor"             : DATA['actor'], // Actor
                    "permission"        : "active"
                }], 
                "data"            : {
                    "miner"             : DATA['actor'], // wax.userAccount
                    "nonce"             : DATA['nonce']
                }
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
async function packedtrx_limitlesswax(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('limitlesswax');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('limitlesswax', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
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
                  "miner"           : DATA['actor'], 
                  "info"            : 'cpu'
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









async function packedtrx_ss_return(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('yeomenwarder');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'starshipgame',
                'name'              : 'collect', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'player' 				: DATA['actor'],
                    'starship'              : DATA['shipid']
                },
            }], 
            "context_free_actions"      : [],
            "transaction_extensions"    : []
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
async function packedtrx_ss_launch(DATA){

    // FIX MISTAKE SENDER ACTION
    try {
        console.log(DATA); 
        DATA['shipid'][2].split('-')[0]; 
    } catch (err) {
        DATA['shipid'] = DATA['shipid'][0].split('-')[0]; 
        const ss_return = await packedtrx_ss_return(DATA); 

        console.log(DATA); 

        return new Promise(function(resolve, reject) {
            resolve({
                packed_trx              : ss_return['packed_trx'], 
                serializedTransaction   : ss_return['serializedTransaction'], 
                serial                  : ss_return['serial'], 
                transactions            : ss_return['transactions'], 
                transaction             : ss_return['transaction']
            }); 
        });
    }; 
    
    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('yeomenwarder');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'starshipgame',
                'name'              : 'claim', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'player' 				: DATA['actor'],
                },
            }].concat(
                (function (data){
                    data['val'] = []; 
                    for (const x of data['shipid']) {
                        data['val'].push({
                            'account'           : 'starshipgame', 
                            'name'              : 'move2planet', 
                            "authorization"     : [{
                                "actor"             : data['actor'],
                                "permission"        : "active"
                            }],
                            'data'              : {
                                'player'            : data['actor'],
                                'starship'          : x.split('-')[0],
                                'planet'            : x.split('-')[1]
                            },
                        })
                    }; return data['val']; 
                })(DATA)
            ), 
            "context_free_actions"      : [],
            "transaction_extensions"    : []
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


async function packedtrx_kq_login(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('yeomenwarder');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'orng.wax',
                'name'              : 'requestrand', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'assoc_id' 				: DATA['sign'],
                    'signing_value'         : DATA['sign'],
                    'caller'                : DATA['actor']
                },
            }], 
            "context_free_actions"      : [],
            "transaction_extensions"    : [],
            "delay_sec"                 : 0,
            "max_cpu_usage_ms"          : 0,
            "max_net_usage_words"       : 0
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
async function packedtrx_cc_login(DATA){

    console.log(DATA)

    try {
        const chainId       = DATA['chainId'];
        //    const abiObj        = await get_rawabi_and_abi('yeomenwarder');
        const api           = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder(), chainId }); 
        //    api.cachedAbis.set('yeomenwarder', {abi: abiObj.abi, rawAbi: abiObj.rawAbi});
        const transaction   = {
            "expiration"        : DATA['expiration'],
            "ref_block_num"     : 65535 & Number(DATA['block_num_or_id'].split('-')[0]), //   block_num_or_id: 126815123 65535 & 126815126
            "ref_block_prefix"  : Number(DATA['block_num_or_id'].split('-')[1]),
            "actions": [{
                'account'           : 'orng.wax',
                'name'              : 'requestrand', 
                "authorization"     : [{
                    "actor"             : DATA['actor'],
                    "permission"        : "active"
                }],
                'data'              : {
                    'assoc_id' 				: DATA['sign'],
                    'signing_value'         : DATA['sign'],
                    'caller'                : DATA['actor']
                },
            }], 
            "context_free_actions"      : [],
            "transaction_extensions"    : [],
            "delay_sec"                 : 0,
            "max_cpu_usage_ms"          : 0,
            "max_net_usage_words"       : 0
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