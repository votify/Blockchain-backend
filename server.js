const app = require("express")();
const bodyParser = require("body-parser");
const httpServer = require("http").Server(app);
const axios = require("axios");
const io = require("socket.io")(httpServer);
const client = require("socket.io-client");
const logger = require("morgan");

const BlockChain = require("./models/chain");
const Action = require("./models/actions");
const { actions } = require("./utils/constants");

const socketListeners = require("./socketListeners");

const PORT = process.env.PORT || 3000;

var nodeList = [];
var status = false;

const blockChain = new BlockChain(io, null);

app.use(logger("dev"));
app.use(bodyParser.json());

app.post("/nodes", (req, res) => {
  const { host } = req.body;
  const { callback, nodeLength } = req.query;
  const node = `https://${host}`;
  const socketNode = socketListeners(io, client(node), blockChain);
  nodeList.push({ node, id: socketNode.id });
  blockChain.addNode(socketNode);
  if (callback === "true") {
    if (parseInt(nodeLength) > 1 && nodeList.length === 1) {
      axios.post(`${node}/request-list`, {
        host: req.hostname,
      });
    } else if (nodeList.length > 1 && parseInt(nodeLength) === 1) {
      axios.post(`${node}/update-list`, {
        requestNodeList: nodeList,
      });
    }
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/nodes?callback=true&nodeLength=${nodeList.length}`, {
      host: req.hostname,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.post("/action", (req, res) => {
  const { type, data, signature, lock } = req.body;
  console.log(req.body);
  let clientAction = new Action(type, data, signature, lock);
  if (blockChain.verifyAction(clientAction)) {
    res.json({ status: "valid", id: clientAction.id });
    io.emit(actions.ADD_ACTION, clientAction);
    blockChain.newAction(clientAction);
    console.log(
      `Added action: ${JSON.stringify(clientAction.getDetails(), null, "\t")}`
    );
  } else {
    res.json({ status: "invalid", id: null });
  }
});

app.get("/action/:id", (req, res) => {
  let id = req.params.id;
  res.json(blockChain.getAction(id));
});

app.get("/chain", (req, res) => {
  res.json(blockChain.toArray()).end();
});

app.get("/check/:address", (req, res) => {
  let address = req.params.address;
  let result = blockChain.getStatus(address);
  res.json({ result });
});

app.get("/count/:id", (req, res) => {
  const id = req.params.id;
  let result = blockChain.countVote(id);
  res.json({ result });
});

app.get("/history/:lock", (req, res) => {
  let lock = req.params.lock;
  let history = blockChain.getHistory(lock);
  res.json(history);
});

app.get("/elections", (req, res) => {
  let elections = blockChain.getElections();
  res.json(elections);
});

app.get("/address/:pubKey", (req, res) => {
  let pubKey = req.params.pubKey;
  let address = blockChain.getLock(pubKey);
  res.json({ address });
});

app.get("/elections/:id", (req, res) => {
  let id = req.params.id;
  res.json(blockChain.getElection(id));
});

app.get("/hello", (req, res) => {
  io.emit("hello");
  res.json({ status: 200 });
});

app.get("/check", (req, res) => {
  res.json(true);
});

app.get("/getnodelist", (req, res) => {
  res.json(nodeList);
});

app.post("/request-list", (req, res) => {
  const { host } = req.body;
  const node = `https://${host}`;
  axios.post(`${node}/update-list`, {
    requestNodeList: nodeList,
  });
  res.json({ status: "request accepted" }).end();
});

app.post("/setelection", (req, res) => {
  const { year, name, nominees, deadline } = req.body;
  let result = blockChain.setElection(year, name, nominees, deadline);
  if (result) {
    io.emit(actions.ADD_ELECTION, req.body);
  }
  res.json({ status: result });
});

app.post("/extentelection", (req, res) => {
  const { year, name, newDeadline } = req.body;
  let result = blockChain.extentElection(year, name, newDeadline);
  if (result) {
    io.emit(actions.EXTENT_ELECTION, req.body);
  }
  res.json({ status: result });
});

app.post("/update-list", (req, res) => {
  const { requestNodeList } = req.body;
  const currentNode = `https://${req.hostname}`;
  console.log(currentNode);

  for (let index = 0; index < requestNodeList.length; index++) {
    if (requestNodeList[index].node !== currentNode) {
      axios.post(`${requestNodeList[index].node}/request-join`, {
        host: req.hostname,
      });
    }
  }
  res.json({ status: "node list return" }).end();
});

app.post("/request-join", (req, res) => {
  const { host } = req.body;
  const { callback } = req.query;
  const node = `https://${host}`;
  const socketNode = socketListeners(io, client(node), blockChain);
  nodeList.push({ node, id: socketNode.id });
  blockChain.addNode(socketNode);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/request-join?callback=true`, {
      host: req.hostname,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

io.on("connection", (socket) => {
  console.info(`Socket connected, ID: ${socket.id}`);

  if (status === false) {
    setInterval(function () {
      if (!blockChain.miningStatus) {
        io.emit(actions.CHECKING);
      }
    }, 300000);
  }

  socket.on("disconnect", () => {
    console.log(`Socket disconnected, ID: ${socket.id}`);
    for (let index = 0; index < nodeList.length; index++) {
      if (nodeList[index].id === socket.id) {
        nodeList.splice(index, 1);
        break;
      }
    }
  });
});

// blockChain.addNode(socketListeners(client(`http://localhost:${PORT}`)));

httpServer.listen(PORT, () =>
  console.info(`Express server running on ${PORT}...`)
);
