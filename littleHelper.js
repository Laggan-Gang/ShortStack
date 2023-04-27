const express = require("express");

const app = express();
const queue = [];

app.use(express.json());

app.get("/api/developers", (req, res) => {
  res.json(db);
});

app.get("/api/developers/:id", (req, res) => {
  const paramId = req.params.id;
  const dev = db.find((e) => e.id == paramId);
  return dev ? res.json(dev) : res.status(404).end();
});

app.post("/api/developers/", (req, res) => {
  const dev = {
    id: db.length + 1,
    name: req.body.name,
    email: req.body.email,
  };
  db.push(dev);
  res
    .status(201)
    .header("location", `api/developers/${dev.id}`)
    .json(dev)
    .end();
});

module.exports = {
  app,
};
