const express = require('express');
const cors = require('cors');
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

require('dotenv').config()
const port = process.env.PORT || 5000;

//maddleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Synthiya and Cumki those are friend')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vivchso.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    const productCollection = client.db('productOfPagination').collection('products')
    const ordersCollection = client.db('productOfPagination').collection('orders')

    try {

        app.get('/product', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = productCollection.find(query)
            const result = await cursor.skip(page*size).limit(size).toArray()
            const count = await productCollection.estimatedDocumentCount()
            res.send({result,count})
        })
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            console.log("ID:", id);
            console.log("Query:", query); // Log any errors that occur during execution

            const result = await productCollection.deleteOne(query)
            res.send(result)
        })
        //orders 
        app.post('/orders' , async(req , res)=>{
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        app.get('/orders', async(req , res)=>{
            const query = {}
            const cursor = ordersCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/orders/:id' , async(req , res)=>{
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await ordersCollection.deleteOne(query)
            res.send(result)
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`listning port in${port}`)
})