const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// fYN7AnSSg0CuTDMX
// adVerseDb


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vn5qrrb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const allProductCollection = client.db("dbAdVerse").collection("allProductss")
        const allOrdersCollection = client.db("dbAdVerse").collection("allOrders")
        const allUsersCollection = client.db("dbAdVerse").collection("allUsers")
        const myProductsCollection = client.db("dbAdVerse").collection("myProducts")

        // Sendng all products to Cliet Side
        app.get("/allproducts", async (req, res) => {
            const query = {}
            const allProducts = await allProductCollection.find(query).toArray()
            res.send(allProducts)
        })

        // Insertig a product
        app.post("/allproduct", async (req, res) => {
            const product = req.body
            const result = await allProductCollection.insertOne(product)
            res.send(result)
        })

        // inserting product to database
        // app.post("/myproducts", async (req, res) => {
        //     const product = req.body
        //     const result = await myProductsCollection.insertOne(product)
        //     res.send(result)
        // })


        // updated work
        app.post("/myproducts", async (req, res) => {
            const product = req.body
            const result = await allProductCollection.insertOne(product)
            res.send(result)
        })

        // finding my products using email
        // app.get("/myproducts", async (req, res) => {
        //     const email = req.query.email
        //     const query = { sellerEmail: email }
        //     const result = await myProductsCollection.find(query).toArray()
        //     res.send(result)
        // })

        // updated work
        app.get("/myproducts", async (req, res) => {
            const email = req.query.email
            const query = { sellerEmail: email }
            const result = await allProductCollection.find(query).toArray()
            res.send(result)
        })

        // delete My product
        app.delete("/myproducts/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await myProductsCollection.deleteOne(query)
            res.send(result)
        })

        // sending category products to client side by category name
        app.get("/allproducts/:categoryName", async (req, res) => {
            const categoryName = req.params.categoryName
            const query = { category: categoryName }
            const result = await allProductCollection.find(query).toArray()
            res.send(result)
        })

        // inserting users to database
        app.post("/users", async (req, res) => {
            const user = req.body
            const result = await allUsersCollection.insertOne(user)
            res.send(result)
        })

        // find buyers form usrs
        app.get("/buyers", async (req, res) => {
            const query = { role: "buyer" }
            const result = await allUsersCollection.find(query).toArray()
            res.send(result)
        })
        // find buyers form usrs
        app.get("/sellers", async (req, res) => {
            const query = { role: "seller" }
            const result = await allUsersCollection.find(query).toArray()
            res.send(result)
        })

        // inserting order to database
        app.post("/orders", async (req, res) => {
            const order = req.body
            const result = await allOrdersCollection.insertOne(order)
            res.send(result)
        })

        // finding all orders
        app.get("/orders", async (req, res) => {
            const email = req.query.email
            console.log(email);
            const query = { email: email }
            const result = await allOrdersCollection.find(query).toArray()
            res.send(result)
        })

        // find buyer
        app.get("/users/sellers/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await allUsersCollection.findOne(query)
            res.send({ isSeller: user?.role === "seller" })
        })

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await allUsersCollection.findOne(query)
            console.log(user);
            res.send({ isAdmin: user?.role === "admin" })
        })
    } finally {

    }
}
run().catch(err => console.log(err))



app.get('/', (req, res) => {
    res.send("server is runnig")
})

app.listen(port, () => {
    console.log("Server is runnig on port", port);
})