const express = require("express");

const app = express();
const queue = ["<@207840759087497217>"];

app.use(express.json());

app.get("/queue", (req, res) => {
  res.json(db);
});

app.post("/queue", (req, res) => {
  const dev = {
    id: db.length + 1,
    name: req.body.name,
    email: req.body.email,
  };
  db.push(dev);
  res.status(201).header("location", `queue`).json(dev).end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
