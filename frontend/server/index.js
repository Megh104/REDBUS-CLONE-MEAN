const express = require('express')
const bodyparser = require('body-parser')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express();

// Enable CORS for all origins in development, specific origin in production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:4200'
}));

app.use(bodyparser.json())
const customerroutes = require("./routes/customer");
const routesroute = require("./routes/route");
const bookingroute = require("./routes/booking")
app.use(bookingroute)
app.use(routesroute)
app.use(customerroutes)

const DBURL = process.env.MONGODB_URI || "mongodb+srv://admin:admin@tedbus.vqk1yid.mongodb.net/?retryWrites=true&w=majority&appName=tedbus"
mongoose.connect(DBURL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error('MongoDB connection error:', err))

app.get('/', (req, res) => {
  res.send('Hello, RedBus API is working')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
