const express = require("express");

const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3004);

    console.log("server is created http://localhost:3004");
  } catch (e) {
    console.log(`error msg is ${e.message}`);
  }
};

initializeDb();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const user = await db.get(userQuery);
  const hashPassword = await bcrypt.hash(password, 10);

  if (user !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (password.length <= 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const postQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}', '${name}', '${hashPassword}', '${gender}', '${location}');`;

    const dataPost = await db.run(postQuery);
    response.status(200);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const user = await db.get(userQuery);

  if (user === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, user.password);
    if (isPassword == true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const userQuery = `SELECT * FROM user WHERE username='${username}';`;
  const user = await db.get(userQuery);
  const isPassword = await bcrypt.compare(oldPassword, user.password);
  if (isPassword !== true) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length >= 5) {
      const hashPassword = await bcrypt.hash(newPassword, 10);
      const putQuery = `UPDATE user SET password='${hashPassword}';`;
      const update = await db.run(putQuery);
      response.status(200);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  }
});

module.exports = app;
