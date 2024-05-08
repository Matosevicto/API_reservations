const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());



const mongoose = require('mongoose');
const { Schema, ObjectId } = mongoose;

mongoose.connect('mongodb://127.0.0.1:27017/Azil', {
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

const UnosSchema = new Schema({
   id: { type: Number, unique: true },
  ime: String,
  vrsta: String,
  spol: String,
  starost: Number,
  rasa: String,
  udomljen: Boolean,
  slika: {
    type: String,
    match: /^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/,
    // Regular expression for URL validation
  },
  cip: Boolean,
  zadnjiPregled: Date,
  napomena: String
});

const Unos = mongoose.model("Unos", UnosSchema);



const DonacijeSchema = new Schema({
 
  id: { type: Number, unique: true },
  kategorija: String,
  tip: String,
  vrijednost: Number,
  opis: String
});

const Donacija = mongoose.model("Donacija", DonacijeSchema);

const ObavijestSchema = new Schema({
  id: { type: Number, unique: true },
  naslov:String,
  datum:Date,
  tekst:String,
  vazno:Boolean
})
const Obavijest = mongoose.model("Obavijest",ObavijestSchema)

app.post("/zivotinje", async (req, res) => {
  
  if (!req.body.ime || !req.body.spol || !req.body.starost ) {
    return res.status(400).send('Ime, spol i starost su potrebni za unos.');
  }

  try {
    
    const id = await getNextSequence('unosId');

   
    const newUnos = new Unos({
      id,
      ime: req.body.ime,
      vrsta: req.body.vrsta,
      spol: req.body.spol,
      starost: req.body.starost,
      rasa: req.body.rasa,
      udomljen: req.body.udomljen,
      slika: req.body.slika,
      cip: req.body.cip,
      zadnjiPregled: req.body.zadnjiPregled,
      napomena: req.body.napomena
    });

    
    await newUnos.save();

    
    res.send("Životinja spremljena u bazu.");
  } catch (error) {
    
    console.error('Error saving životinja:', error);
    res.status(500).send(error.message);
  }
});


app.get('/zivotinje', async (req, res) => {
  try {
    const allUnos = await Unos.find();
    res.json(allUnos);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.get("/zivotinje/:id", async (req, res) => {
  try {
    const unos = await Unos.findOne({ id: req.params.id });
    if (!unos) {
      return res.status(404).send('Životinja s navedenim ID-om nije pronađena.');
    }
    res.json(unos); 
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.delete('/zivotinje/:id', async (req, res) => {
  try {
    const unos = await Unos.findOneAndDelete({ id: req.params.id });
    if (!unos) {
      return res.status(404).send('Životinja ne postoji.');
    }
    res.send('Životinja izbrisana');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.put('/zivotinje/:id', async (req, res) => {
  try {
    const updatedUnos = await Unos.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!updatedUnos) {
      return res.status(404).send('Životinja ne postoji');
    }
    res.json(updatedUnos);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.patch('/zivotinje/:id', async (req, res) => {
  try {
    const zivotinjeId = parseInt(req.params.id); 
    const { udomljen } = req.body;


    const existingUnos = await Unos.findOne({ id: zivotinjeId }); 
    if (!existingUnos) {
     
      return res.status(404).send('Životinja s tim ID-om nije pronađena.');
    }

   
    existingUnos.udomljen = udomljen;

    
    const updatedUnos = await existingUnos.save();

    
    res.json(updatedUnos);
  } catch (error) {
   
    res.status(500).send(error.message);
  }
});



app.get('/donacije', async (req, res) => {
  try {
    const allDonacije = await Donacija.find();
    res.json(allDonacije);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/donacije", async (req, res) => {
  if (!req.body.tip) {
    return res.status(400).send('Tip donacije je potreban.');
  }

  const id = await getNextSequence('donacijaId');

  const newDonacija = new Donacija({
    id,
    kategorija:req.body.kategorija,
    tip: req.body.tip,
    vrijednost: Number(req.body.vrijednost),
    opis: req.body.opis
  });
  try {
    await newDonacija.save();
    res.send("Donacija je spremljena");
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.put('/donacije/:id', async (req, res) => {
  try {
    const updatedDonacija = await Donacija.findOneAndUpdate(
    
      { id: req.params.id }, 
      { kategorija: req.body.kategorija }, 
      { new: true }
    );
    if (!updatedDonacija) {
      return res.status(404).send('Donacija ne postoji');
    }
    res.json(updatedDonacija);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.delete('/donacije/:id', async (req, res) => {
  try {
    const donacija = await Donacija.findOneAndDelete({ id: req.params.id });
    if (!donacija) {
      return res.status(404).send('Donacija ne postoji.');
    }
    res.send('Donacija izbrisana');
  } catch (error) {
    res.status(500).send(error.message);
  }
});




app.get('/obavijesti', async (req, res) => {
  try {
    const allObavijesti = await Obavijest.find();
    res.json(allObavijesti);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/obavijesti/:id", async (req, res) => {
  try {
    const obavijest = await Obavijest.findOne({ id: req.params.id });
    if (!obavijest) {
      return res.status(404).send('Obavijest s navedenim ID-om nije pronađena.');
    }
    res.json(obavijest); 
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/obavijesti", async (req, res) => {
  if (!req.body.naslov ) {
    return res.status(400).send('Nalov je potreban.');
  }

  const id = await getNextSequence('ObavijestId');

  const newObavijest = new Obavijest({
    id,
    naslov:req.body.naslov,
    datum:req.body.datum,
    tekst:req.body.tekst,
    vazno:req.body.vazno
  });
  try {
    await newObavijest.save();
    res.send("Obavijest spremljena u bazu.");
  } catch (error) {
    res.status(500).send(error.message);
  }
});
app.delete('/obavijesti/:id', async (req, res) => {
  try {
    const obavijest = await Obavijest.findOneAndDelete({ id: req.params.id });
    if (!obavijest) {
      return res.status(404).send('Obavijest ne postoji.');
    }
    res.send('Obavijest izbrisana');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
