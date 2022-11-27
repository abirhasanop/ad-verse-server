const express = require("express")
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET)

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
        const paymentCollection = client.db("dbAdVerse").collection("payments")

        // Sendng all products to Cliet Side
        app.get("/allproducts", async (req, res) => {
            const query = {}
            const allProducts = await allProductCollection.find(query).toArray()
            res.send(allProducts)
        })

        // update a advertize status 
        app.put("/allproduct/:id", async (req, res) => {
            // const product = req.body
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertised: true
                }
            }
            const result = await allProductCollection.updateOne(query, updatedDoc, options)
            res.send(result)
        })


        // find adevertized product
        app.get("/advertizedproduct", async (req, res) => {
            const query = { advertised: true }
            const result = await allProductCollection.find(query).toArray()
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
            const result = await allProductCollection.deleteOne(query)
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

        // delete a user 
        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await allUsersCollection.deleteOne(query)
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
            const updatedProduct = await allProductCollection.updateOne({ _id: ObjectId(order.productId) }, { $set: { status: "Sold" } })
            const result = await allOrdersCollection.insertOne(order)
            res.send(result)
        })

        // finding all orders
        app.get("/orders", async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const result = await allOrdersCollection.find(query).toArray()
            res.send(result)
        })
        // find a order for payment
        app.get("/orders/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await allOrdersCollection.findOne(query)
            res.send(result)
        })



        // delete orders nad update products staus
        app.post("/orders/delete/:id", async (req, res) => {
            const id = req.params.id
            // console.log(id);
            const productId = req.body.productId
            const query = { _id: ObjectId(id) }
            const updatedProduct = await allProductCollection.updateOne({ _id: ObjectId(productId) }, { $set: { status: "Available" } })
            const result = await allOrdersCollection.deleteOne(query)
            res.send(result)
        })

        // find buyer
        app.get("/users/sellers/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await allUsersCollection.findOne(query)
            res.send({ isSeller: user?.role === "seller" })
        })
        // find admin
        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const user = await allUsersCollection.findOne(query)
            res.send({ isAdmin: user?.role === "admin" })
        })



        // Verifying Sellers
        app.get('/api/seller/verify/:email', async (req, res) => {
            const email = req.params.email
            const updatedUser = await allUsersCollection.updateOne({ email }, { $set: { varified: true } })
            const updateProducts = await allProductCollection.updateMany({ sellerEmail: email }, { $set: { varified: true } })
            // console.log(updateProducts)
            res.json(updatedUser)
        })


        // stripe 
        app.post("/create-payment-intent", async (req, res) => {
            const order = req.body
            const price = order.price
            const amount = price * 100

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        app.post("/payments", async (req, res) => {
            const payment = req.body
            const orderId = payment.orderId
            const transactionId = payment.transactionId
            const options = { upsert: true }
            const updatedOrder = await allOrdersCollection.updateOne({ _id: ObjectId(orderId) }, { $set: { isPaid: true, transactionId: transactionId } }, options)
            const result = await paymentCollection.insertOne(payment)
            res.send(result)
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