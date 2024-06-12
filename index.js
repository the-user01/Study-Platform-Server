const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://study-platform-c102f.web.app"
    ]
  })
);
app.use(express.json());



const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.8yiviav.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const usersCollection = client.db("studyPlatformDb").collection("users");
    const createStudyCollection = client.db("studyPlatformDb").collection("studyCollection");


    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
      res.send({ token });
    })


    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1];

      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)

      const isAdmin = user?.role === 'Admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }

    const verifyTutor = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)

      const isTutor = user?.role === 'Teacher'
      if (!isTutor) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }

    const verifyStudent = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)

      const isStudent = user?.role === 'Student'
      if (!isStudent) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next();
    }



    // users related api

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    // get admin
    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let admin = false;
      if (user) {
        admin = user?.role === 'Admin'
      }
      res.send({ admin })
    })

    // get tutor
    app.get('/users/tutor/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let tutor = false;
      if (user) {
        tutor = user?.role === 'Teacher'
      }
      res.send({ tutor })
    })

    //get Student
    app.get('/users/student/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      let student = false;
      if (user) {
        student = user?.role === 'Student'
      }
      res.send({ student })
    })


    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesn't exist
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist' });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result)
    })

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })



    // Crete Study relatted api

    // getting all data 
    app.get("/create-session", verifyToken, async (req, res) => {
      const result = await createStudyCollection.find().toArray();
      res.send(result)
    })

    // getting data which are pending
    app.get("/create-session/pending", verifyToken, async (req, res) => {
      const result = await createStudyCollection.find({status: "pending"}).toArray();
      res.send(result)
    })

    app.post("/create-session", verifyToken, verifyTutor, async (req, res) => {
      const session = req.body;
      const result = await createStudyCollection.insertOne(session);
      res.send(result)
    })

    // session status update to reject
    app.patch("/create-session/reject/:id", verifyToken, verifyAdmin, async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};

      const updatedStatus = {
        $set: {
          status: "rejected"
        }
      }

      const result = await createStudyCollection.updateOne(filter, updatedStatus);
      res.send(result);
    })




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send("Study Platform is running");
})
app.listen(port, () => {
  console.log(`Server running in port: ${port}`);
})