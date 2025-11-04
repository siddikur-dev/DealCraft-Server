const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;

const serviceAccount = require("./dealcraftclient-firebase-adminsdk-e7d95f35c0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log("logging info");
  next();
};

const verifyFBToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "UnAuthorized Access 26" });
  }
  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "un authorized access" });
  }

  // verify id token
  try {
    const tokenInfo = await admin.auth().verifyIdToken(token);
    req.token_email = tokenInfo.email;
    next();
  } catch {
    return res.status(401).send({ message: "un authorized access catch" });
  }
};

const verifyJwtToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "unauthorized 51 line" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "UnAuthorized Access" });
    }
    // verify token id
    next();
  });
};

//-
//
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.rfkbq1n.mongodb.net/?appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const db = client.db("products_DB");
    const productsCollection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const usersCollection = db.collection("users");

    // Connect the client to the server	(optional starting in v4.7)

    // jsonWebToken related api
    app.post("/jwtToken", (req, res) => {
      const loggedUser = req.body;
      const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token: token });
      console.log("jwt token", token);
    });

    // get product from db
    app.get("/products", async (req, res) => {
      // sort data
      // const projectFields = { title: 1, price_max: 1, price_min: 1, image: 1 };
      // const cursor = productsCollection
      //   .find()
      //   .sort({ price_min: 1 })
      //   .skip(1)
      //   .limit(2)
      //   .project(projectFields);

      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single product form db
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // get latest product sort(create_at time)
    app.get("/latest-products", async (req, res) => {
      const query = productsCollection
        .find()
        .sort({ price_max: "descending" })
        .limit(6);
      const result = await query.toArray();
      res.send(result);
    });
    // post product to db
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      console.log(result);
      res.send(result);
    });

    // update product from db
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedProduct = req.body;
      const updateDoc = {
        $set: {
          name: updatedProduct.name,
          slug: updatedProduct.slug,
        },
      };
      const result = await productsCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // delete product from db
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const product = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(product);
      res.send(result);
    });

    // get bids related api from bids
    // get all bids from db verify Firebase Token
    app.get("/bids", logger, verifyFBToken, async (req, res) => {
      const query = {};
      const email = req.query.email;
      console.log("token mail", req.token_email);
      console.log("just mail", email);
      if (email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden Access " });
        }
        query.email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get all bids and verifyJWTToken
    // app.get("/bids", logger, verifyJwtToken, async (req, res) => {
    //   const query = {};
    //   const email = req.query.email;
    //   console.log(req.headers.authorization);
    //   if (email) {
    //     query.email = email;
    //   }
    //   const cursor = bidsCollection.find(query);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    // get single bid from db
    app.get("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await bidsCollection.findOne(query);
      res.send(result);
    });

    // get bids by id from db
    app.get("/products/bids/:productId", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const query = { product: id };
      const cursor = bidsCollection.find(query).sort({ price_min: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // post bids to db
    app.post("/bids", async (req, res) => {
      const newBids = req.body;
      const result = await bidsCollection.insertOne(newBids);
      res.send(result);
    });

    // delete single bids
    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    //get user related api from db

    app.get("/users", async (req, res) => {
      const query = req.body;
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get specific user
    app.get("/users/:id", async (req, res) => {
      console.log("headers", req.headers);

      const id = req.params.id;
      const query = { email: id };
      const cursor = usersCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    //post users to db
    app.post("/users", async (req, res) => {
      const newUsers = req.body;
      const email = req.body.email;
      const query = { email: email };
      const existingEmail = await usersCollection.findOne(query);
      if (existingEmail) {
        res.send("This User Already Exist in this site");
      } else {
        const result = await usersCollection.insertOne(newUsers);
        res.send(result);
      }
    });

    // get product from db
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Deal Craft Server Is Running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
