const express = require("express");
const app = express();

const port = 5000;

// Body parser
app.use(express.urlencoded({ extended: false }));

// Home route
app.get("/", (req, res) => {
    console.log( req.url ); 
    
    //	sets the header of the response to the user and the type of response that you would be sending back
    //	res.setHeader('Content-Type', 'text/html');
    //	res.write("<html>");
    //	res.write("<head><title>HELLO</title> </head>");
    //	res.write("<body><h1>HELLO</h1></body>")
    //	res.write("<html>");
    //	res.end();
    res.send("Welcome to a basic express App");
    
});

// Mock API
app.get("/users", (req, res) => {
    res.json([
        { name: "William", location: "Abu Dhabi" },
        { name: "Chris", location: "Vegas" }
    ]);
});

//  app.post("/user", (req, res) => {
//    const { name, location } = req.body;
//  
//    res.send({ status: "User created", name, location });
//  });

// Listen on port 5000
app.listen(port, () => {
    console.log(`Server is booming on port 5000 Visit http://localhost:5000`);
});
