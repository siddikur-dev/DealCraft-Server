const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

//
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

    // Connect the client to the server	(optional starting in v4.7)

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

    // post product to db
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
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

    // get all bids from db
    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.bidder_email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get single bid from db
    app.get("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await bidsCollection.findOne(query);
      res.send(result);
    });

    // post bids to db
    app.post("/bids", async (req, res) => {
      const newBids = req.body;
      const result = await bidsCollection.insertOne(newBids);
      res.send(result);
    });

    

    // delete bids from db
    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
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
