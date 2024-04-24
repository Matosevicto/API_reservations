const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/Reservations', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (error) => {
  console.error('Error connecting to database:', error);
});
db.once('open', function() {
  console.log('Connected to the MongoDB database');
});

const { Schema } = mongoose;

const CounterSchema = new Schema({
  _id: String,
  seq: { type: Number, default: 1 }
});

const Counter = mongoose.model("Counter", CounterSchema);

async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

const ReservationSchema = new Schema({
  id: { type: Number, unique: true },
  name: String,
  surename: String,
  age: Number,
  start:String,
  end:String,
  class:String,
  email: { type: String, required: true }
});

const Reservation = mongoose.model("Reservation", ReservationSchema);

const CitySchema = new Schema({
  id: { type: Number, unique: true },
  name:String,
  country:String
})

const City = mongoose.model("City",CitySchema)

const ClassSchema = new Schema({
  id: { type: Number, unique: true },
  name:String
})
const Class = mongoose.model("Class",ClassSchema)

app.post("/reservations", async (req, res) => {
  if (!req.body.name || !req.body.surename || !req.body.age ) {
    return res.status(400).send('Name, surename and year are required.');
  }

  const id = await getNextSequence('reservationId');

  const newReservation = new Reservation({
    id,
    name: req.body.name,
    surename: req.body.surename,
    age: req.body.age,
    start: req.body.start,
    end: req.body.end,
    class: req.body.class,
    email: req.body.email
  });
  try {
    await newReservation.save();
    res.send("Reservation saved in database");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/reservations', async (req, res) => {
  try {
    const allReservations = await Reservation.find();
    res.json(allReservations);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get("/reservations/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findOne({ id: req.params.id });
    if (!reservation) {
      return res.status(404).send('The reservation with the given ID was not found.');
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).send(error.message);
  }
});




app.delete('/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findOneAndDelete({ id: req.params.id });
    if (!reservation) {
      return res.status(404).send('Reservation does not exist');
    }
    res.send('Reservation deleted');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/reservations/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reservation) {
      return res.status(404).send('Reservation does not exist');
    }
    res.json(reservation);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get('/cities', async (req, res) => {
  try {
    const allCities = await City.find();
    res.json(allCities);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/cities", async (req, res) => {
  if (!req.body.name ) {
    return res.status(400).send('City name is required.');
  }

  const id = await getNextSequence('cityId');

  const newCity = new City({
    id,
    name: req.body.name,
  });
  try {
    await newCity.save();
    res.send("City saved in database");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/classes', async (req, res) => {
  try {
    const allClasses = await Class.find();
    res.json(allClasses);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.post("/classes", async (req, res) => {
  if (!req.body.name ) {
    return res.status(400).send('Class name is required.');
  }

  const id = await getNextSequence('ClassId');

  const newClass = new Class({
    id,
    name: req.body.name,
  });
  try {
    await newClass.save();
    res.send("Class saved in database");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
