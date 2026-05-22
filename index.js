const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { jwtVerify, createRemoteJWKSet } = require('jose-cjs');
const uri = process.env.DB_URI


const app = express()
app.use(express.json())
app.use(cors())
const port = process.env.PORT || 5000

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});




const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    // console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });
  }
};




async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// create a database and a collection

const db = client.db('Doc-appoint')
const doctorsCollection = db.collection('doctors')
const appointmentsCollection = db.collection('appointments')

// create a route for the all doctors with the GET method add query and search param

app.get('/doctors', async (req, res) => {

    try {

        const sortBy = req.query.sortBy;
        const search = req.query.search || "";

        let query = {};
        let sortQuery = {};

        // SEARCH ADD HERE

        if (search) {

            query.name = {
                $regex: search,
                $options: "i"
            };
        }

        // SORTING

        if (sortBy === 'fee_asc') {

            sortQuery = { fee: 1 };

        } else if (sortBy === 'fee_desc') {

            sortQuery = { fee: -1 };
        }

        const result = await doctorsCollection
            .find(query)
            .sort(sortQuery)
            .toArray();

        res.json(result);

    } catch (error) {

        res.status(500).send({
            message: error.message
        });
    }
});

// appointments data api //
app.post('/bookings', async (req, res) => {
    try {
        const bookingData = req.body;
        const result = await appointmentsCollection.insertOne(bookingData);
        res.json(result);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});
// create a route for dashboard with the GET method
app.get('/dashboard/:userId',verifyToken, async (req, res) => {
        try {
            const { userId } = req.params;
            const result = await appointmentsCollection.find({ userId: userId }).toArray();
            res.json(result);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    });


// update booking route
app.patch('/bookings/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const updatedData = req.body;

        const result = await appointmentsCollection.updateOne(
            {
                _id: new ObjectId(id)
            },
            {
                $set: updatedData
            }
        );

        res.send(result);

    } catch (error) {

        res.status(500).send({
            message: error.message
        });
    }
});
// delete booking route
app.delete("/bookings/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const result =
            await appointmentsCollection.deleteOne({
                _id: new ObjectId(id),
            });

        res.json(result);

    } catch (error) {

        res.status(500).send({
            message: error.message
        });
    }
});




// create a route for a single doctor with the GET method

app.get('/doctors/:id',verifyToken, async (req, res) => {       
    const { id } = req.params
    const doctor = await doctorsCollection.findOne({ _id: new ObjectId(id) })
    res.json(doctor)
})





app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
