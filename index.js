const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;


app.use(cors())
app.use(express.json())


app.get('/', (req, res) => {
    res.send('app running')
})

console.log(process.env.DB_USER);
app.listen(port, () => {
    console.log(`app running on ${port}`);
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.lrjyghr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyjwt(req, res, next) {
    const authorized = req.headers.authorization;
    if (!authorized) {
        return res.status(401).send({ message: 'unauthorized' })
    }
    const token = authorized.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if (err) {
            return res.status(401).send({ message: 'unauthorized' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run() {
    try {
        const carCollection = client.db('cardetails').collection('services')
        const orderCollection = client.db('cardetails').collection('orders')

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '5d' })
            res.send({ token })
        })

        app.get('/services', async (req, res) => {
            const query = {};
            const cursor = carCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await carCollection.findOne(query);
            res.send(service)
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const procceOrder = await orderCollection.insertOne(order)
            res.send(procceOrder)
        })
        app.get('/orders', verifyjwt, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                res.status(403).send({ message: 'unauthorized' })

            }
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders)
        })
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updateDoc = {
                $set: {
                    status: status,
                }


            }
            const result = await orderCollection.updateOne(query, updateDoc)
            res.send(result)
        })
        app.delete('/orders/:id',verifyjwt, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const deleted = await orderCollection.deleteOne(query)
            res.send(deleted)
        })
    }
    finally {

    }


}

run()