const express = require("express");

const app = express();
let queue = [];

app.use(express.json());

app.get("/queue", (req, res) => {
  res.status(200).header("location", "queue").json(queue).end();
});

app.post("/queue", (req, res) => {
  const queuer = req.body.id;
  if (!queue.includes(queuer)) {
    queue.push(queuer);
  }
  res.status(201).header("location", `queue`).json(queue).end();
});

app.delete("/queue", (req, res) => {
  const queuer = req.body.id;
  queue = queue.filter((e) => e !== queuer);
  res.status(200).header("location", "queue").json(queue).end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`Little Helper is alive and well!`);
});

//curl -H "Content-Type: application/json" -d '{"id":"Beatrice dev"}' http://localhost:3000/queue
//curl http://localhost:3000/queue -1
