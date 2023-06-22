const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// mongo setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vahgs6d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    // connect to database collection
    const legoCollection = client.db("LegoLelo").collection("toys");

    // get all the toys information
    app.get("/all-toys", async(req, res)=>{
      const query = {};
      const limit = parseInt(req.query.limit);
      const cursor = legoCollection.find(query).limit(limit);
      const result = await cursor.toArray();
      res.send(result);
    });

    // search api
    app.get("/search-toy/:key", async(req, res)=>{
      const search = req.params.key;
      const result = await legoCollection.find(
        {
            "$or":[
                {toyName:{$regex:search}}
            ]
        }
    ).toArray();
    res.send(result);
    });

    // get single toy details
    app.get("/toy-details/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await legoCollection.findOne(query);
      res.send(result);
    })

    app.get("/toy-category/:category", async(req, res)=>{
      const category = req.params.category;
      const result = await legoCollection.find({
        "$or": [
          {subCategory: {$regex: category}}
        ]
      }).toArray();
      res.send(result)
    })

    // get my toys information
    app.get("/my-toys", async(req, res)=>{
      let query = {};
      let sort = {};

      if(req.query?.email){
        query = {email: req.query.email}
      }
      
      if(req.query.sort === "Ascending"){
        sort = {price: 1};
      }else if(req.query.sort === "Descending"){
        sort = {price: -1}
      }
      // const sort = { price: 1 };
      const result = await legoCollection.find(query).sort(sort).toArray();
      res.send(result)
    })

    // add toy information
    app.post("/add-toy", async(req, res)=>{
      const toy = req.body;
      const result = await legoCollection.insertOne(toy);
      res.send(result);
    })

    // delete operation
    app.delete("/toy-delete/:id", async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await legoCollection.deleteOne(query)
      res.send(result);
    })

    // update functionality
    app.patch("/toy-update/:id", async(req, res)=>{
      const id = req.params.id;
      const toyUpdate = req.body;

      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set: {
          picture: toyUpdate.picture,
          toyName: toyUpdate.toyName,
          details: toyUpdate.details,
          quantity: toyUpdate.quantity,
          ratings: toyUpdate.ratings,
          price: toyUpdate.price,
        }
      }

      const result = await legoCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res)=>{
    res.send("sever is running");
});

// start the server
app.listen(port, ()=>{
    console.log(`visit http://localhost:${port}`)
})