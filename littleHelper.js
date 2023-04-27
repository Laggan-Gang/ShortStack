const express = require("express");

const app = express();
const queue = ["<@207840759087497217>"];

app.use(express.json());

app.get("/queue", (req, res) => {
  res.json(queue);
});

app.post("/queue", (req, res) => {
  const queuer = req.body.id;
  queue.push(queuer);
  res.status(201).header("location", `queue`).json(queue).end();
});

app.delete("/queue", (req, res) => {
  const queuer = req.body.id;
  queue.splice(queue.indexOf[queuer]);
  res.status(200).header("location", "queue").json(queue).end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

//curl -H "Content-Type: application/json" -d '{"id":"Beatrice dev"}' http://localhost:3000/queue
//curl http://localhost:3000/queue -1
