const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Invalid token' });
        }
        req.user = decoded;
        next();
    })
}

async function run() {
    const productCollection = client.db('productOfPagination').collection('products')
    const ordersCollection = client.db('productOfPagination').collection('orders')

    try {

        app.get('/product', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = productCollection.find(query)
            const result = await cursor.skip(page * size).limit(size).toArray()
            const count = await productCollection.estimatedDocumentCount()
            res.send({ result, count })
        })
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            console.log("ID:", id);
            console.log("Query:", query); // Log any errors that occur during execution

            const result = await productCollection.deleteOne(query)
            res.send(result)
        })
        // send jwt token 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })
        //orders 
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order)
            res.send(result)
        })
        app.get('/orders', verifyJWT, async (req, res) => {
            const user = req.user; // Access decoded payload from req.user
            if (user.email !== req.query.email) {
                return res.status(403).send({ message: 'Forbidden access' });
            }
            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
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