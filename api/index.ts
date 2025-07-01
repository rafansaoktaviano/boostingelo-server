require("dotenv/config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { join } = require("path");
const bearerToken = require("express-bearer-token");
const db = require("./models");
const { Op } = require("sequelize");
const http = require("http"); // Import the HTTP module
const socketIo = require("socket.io");

const PORT = process.env.PORT || 8000;
const app = express();

const server = http.createServer(app); // Create an HTTP server

const { verifyToken } = require("./lib/jwt");

const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_FE_URL, // Replace with your client's URL
    methods: ["GET", "POST", "PUT"],
  },
});

const corsOptions = {
  origin: "https://tech-haven-client.vercel.app",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use(express.json());
const cron = require("node-cron");
//#region API ROUTES

const socketIdMap = new Map();
const adminSocketsMap = new Map();

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userToken;

  const decoded = verifyToken(userId);

  const data = await db.users.findByPk(decoded.id);

  if (data.dataValues.role !== "Customer") {
    const warehouseId = data.warehouses_id;
    if (!adminSocketsMap.has(warehouseId)) {
      adminSocketsMap.set(warehouseId, []);
    }
    adminSocketsMap.get(warehouseId).push(socket.id);
  }

  if (decoded) {
    if (!socketIdMap.has(decoded.id)) {
      socketIdMap.set(decoded.id, []);
    }
    socketIdMap.get(decoded.id).push(socket.id);
  }
  console.log(`A user connected ${socket.id}`);

  socket.on("disconnect", () => {
    if (decoded && data.dataValues.role === "Customer") {
      socketIdMap.delete(socket.id);
    } else if (decoded) {
      const warehouseId = data.dataValues.warehouses_id;
      if (adminSocketsMap.has(warehouseId)) {
        const adminSockets = adminSocketsMap.get(warehouseId);
        const index = adminSockets.indexOf(socket.id);
        if (index !== -1) {
          adminSockets.splice(index, 1);
          if (adminSockets.length === 0) {
            adminSocketsMap.delete(warehouseId);
          }
        }
      }
    }
  });

  console.log("socketId", socketIdMap);
});

const checkAndUpdateOrders = async () => {
  try {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    const [affectedRows] = await db.orders_details.update(
      { status: "Order Canceled" },
      {
        where: {
          createdAt: {
            [Op.lt]: fifteenMinutesAgo,
          },
          status: "Payment Pending",
        },
      }
    );

    // const oneSecondAgo = new Date();
    // oneSecondAgo.setSeconds(oneSecondAgo.getSeconds() - 1);

    // const dataWithinOneSecond = await db.orders_details.findAll({
    //   where: {
    //     updatedAt: {
    //       [Op.gte]: oneSecondAgo,
    //     },
    //     status: "Order Canceled",
    //   },
    //   group: ["transaction_uid"],
    // });

    console.log(`Canceled ${affectedRows} orders.`);

    // if (dataWithinOneSecond.length > 0) {
    //   dataWithinOneSecond.forEach((order) => {
    //     const userId = order.dataValues.users_id;
    //     const socketId = socketIdMap.get(userId);
    //     if (socketId) {
    //       io.to(socketId).emit("statusChange", { status: "Order Canceled" });
    //     }
    //   });
    // }
  } catch (error) {
    console.error("Error canceling orders:", error);
  }
};

const checkPackageArrived = async () => {
  try {
    const oneMinutesAgo = new Date();
    oneMinutesAgo.setMinutes(oneMinutesAgo.getMinutes() - 1);

    const [affectedRows] = await db.orders_details.update(
      { status: "Package Arrived" },
      {
        where: {
          createdAt: {
            [Op.lt]: oneMinutesAgo,
          },
          status: "Package Sent",
        },
      }
    );

    const oneSecondAgo = new Date();
    oneSecondAgo.setSeconds(oneSecondAgo.getSeconds() - 1);

    const dataWithinOneSecond = await db.orders_details.findAll({
      where: {
        updatedAt: {
          [Op.gte]: oneSecondAgo,
        },
        status: "Package Arrived",
      },
      group: ["transaction_uid"],
    });

    console.log(dataWithinOneSecond);
    if (dataWithinOneSecond) {
      const user = dataWithinOneSecond.map((value) => {
        console.log(value);
        return socketIdMap.get(value.users_id);
      });

      console.log(user);

      if (user) {
        user.map((value) => {
          return io.to(value).emit("Package Arrived", {
            message: "Your package has been Arrived",
          });
        });
      }
    }

    console.log(`Package Arrived ${affectedRows}`);
  } catch (error) {
    console.error("Error canceling orders:", error);
  }
};
const orderCompleteAfter7Days = async () => {
  try {
    const oneMinutesAgo = new Date();
    oneMinutesAgo.setDate(oneMinutesAgo.getDate() - 7);

    const [affectedRows] = await db.orders_details.update(
      { status: "Order Completed" },
      {
        where: {
          createdAt: {
            [Op.lt]: oneMinutesAgo,
          },
          status: "Package Arrived",
        },
      }
    );

    const oneSecondAgo = new Date();
    oneSecondAgo.setSeconds(oneSecondAgo.getSeconds() - 1);

    const dataWithinOneSecond = await db.orders_details.findAll({
      where: {
        updatedAt: {
          [Op.gte]: oneSecondAgo,
        },
        status: "Order Completed",
      },
      group: ["transaction_uid"],
    });

    console.log(dataWithinOneSecond);
    if (dataWithinOneSecond) {
      const user = dataWithinOneSecond.map((value) => {
        console.log(value);
        return socketIdMap.get(value.users_id);
      });

      console.log(user);

      if (user) {
        user.map((value) => {
          return io.to(value).emit("Order Completed", {
            message: "Your Order Has Been Completed",
          });
        });
      }
    }

    console.log(`Order Completed${affectedRows}`);
  } catch (error) {
    console.error("Error canceling orders:", error);
  }
};

cron.schedule("* * * * *", checkAndUpdateOrders);
cron.schedule("* * * * *", checkPackageArrived);
cron.schedule("* * * * *", orderCompleteAfter7Days);

const attachIoToRequest = (req, res, next) => {
  req.io = io;
  next();
};

const adminSocket = (req, res, next) => {
  req.adminSocket = adminSocketsMap;
  req.customerSocket = socketIdMap;
  next();
};

// ===========================
// NOTE : Add your routes here
// Import Router
const {
  orderRouter,
  authRouter,
  userRouter,
  adminRouter,
  reportRouter,
} = require("./routers");

const {
  productRouter,
  categoryRouter,
  warehouseRouter,
  stockRouter,
  rajaOngkirRouter,
} = require("./routers");
app.use("/api/product", productRouter);
app.use(bearerToken());
app.use("/api/order", attachIoToRequest, adminSocket, orderRouter);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/report", reportRouter);
// app.use("/profilepicture", express.static(`${__dirname}/public/profilePictures`));
app.use("/static", express.static(`${__dirname}/public`));
app.use("/static", express.static("public"));
// app.use("/products", express.static(`${__dirname}/public/products`));
app.use("/api/category", categoryRouter);
app.use("/api/warehouse", warehouseRouter);
app.use("/api/stock", stockRouter);
app.use("/api/rajaongkir", rajaOngkirRouter);

app.get("/api", (req, res) => {
  res.send(`Hello, this is my API HEHEHE`);
});

app.get("/api/greetings", (req, res, next) => {
  res.status(200).json({
    message: "Hello, Student !",
  });
});

// ===========================

// not found
// app.use((req, res, next) => {
//     if (req.path.includes("/api/")) {
//         res.status(404).send("Not found !");
//     } else {
//         next();
//     }
// });

// error
// app.use((err, req, res, next) => {
//     if (req.path.includes("/api/")) {
//         console.error("Error : ", err.stack);
//         res.status(500).send("Error !");
//     } else {
//         next();
//     }
// });
// app.use((err, req, res, next) => {
//     if (req.path.includes("/api/")) {
//         console.error("Error : ", err.stack);
//         res.status(500).send("Error !");
//     } else {
//         next();
//     }
// });

//#endregion

//#region CLIENT
const clientPath = "../../client/build";
app.use(express.static(join(__dirname, clientPath)));

// Serve the HTML page
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, clientPath, "index.html"));
});

// Centralized Error
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const statusMessage = err.message || "Error";

  return res.status(statusCode).send({
    isError: true,
    message: statusMessage,
    data: null,
  });
});

//#endregion

server.listen(PORT, (err) => {
  if (err) {
    console.log(`ERROR: ${err}`);
  } else {
    console.log(`APP RUNNING at ${PORT} ✅`);
  }
});
