const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const port = process.env.PORT || 5000;

app.use(
    cors({
      origin: [
        "http://localhost:5173",
      ]
    })
  );
app.use(express.json());


app.get('/', (req, res) => {
    res.send("Study Platform is running");
})
app.listen(port, () => {
    console.log(`Server running in port: ${port}`);
})