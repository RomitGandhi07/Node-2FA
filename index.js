const express = require("express");
const { JsonDB } = require("node-json-db");
const speakeasy = require("speakeasy");
const uuid = require("uuid");
const QRCode = require('qrcode');
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");

const app = express();

app.use(express.json());

const db = new JsonDB(new Config("myDatabase", true, false, "/"));

app.get("/api", (req, res) => {
  res.json({ message: "Welcome" });
});

// Register user and create temp secret
app.post("/api/register", async (req, res) => {
  const id = uuid.v4();

  try {
    const path = `/user/${id}`;
    const temp_secret = speakeasy.generateSecret({
        name: '2FA Demo App'
    });
    console.log('here');
    db.push(path, { id, temp_secret: temp_secret });
    console.log('here');
    // qrcode.toDataURL(temp_secret.otpauth_url, (err, data_url) => {
    //     console.log('here');
    //     res.send(`<img src="${data_url}">`)
    // })
    // res.json({ id, secret: temp_secret.base32 });
    // const data = await qrcode.toDataURL(temp_secret.otpauth_url);
    // console.log(data); 
    // const data = await QRCode.toDataURL('Im Demo')
    console.log(temp_secret.otpauth_url);
    console.log(temp_secret.base32);
    // QRCode.toString(temp_secret.otpauth_url,{type:'terminal'}, function (err, url) {
    //     console.log(temp_secret.otpauth_url);
    //     console.log(url)
    //   })
    res.json({ id, secret: temp_secret });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error in generating the secret" });
  }
});

// Verify token and make secret permenent
app.post("/api/verify", (req, res) => {
  const { token, userId } = req.body;

  try {
    const path = `/user/${userId}`;
    const user = db.getData(path);
    // console.log(user);
    const { base32: secret } = user.temp_secret;

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
    });

    if (verified) {
        db.push(path, {id: userId, secret: user.temp_secret})
        res.json({verified: true});
    } else {
        res.json({verified: false});
    }
  } catch (error) {
    // console.log(error);
    res.status(500).json({ error: "Erroor in finding user" });
  }
});

// Validate Token

// Verify token and make secret permenent
app.post("/api/validate", (req, res) => {
    const { token, userId } = req.body;
  
    try {
      const path = `/user/${userId}`;
      const user = db.getData(path);
    //   console.log(user);
      const { base32: secret } = user.temp_secret;
  
      const tokenValidated = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 1
      });
  
      if (tokenValidated) {
          res.json({validated: true});
      } else {
          res.json({validated: false});
      }
    } catch (error) {
      // console.log(error);
      res.status(500).json({ error: "Erroor in finding user" });
    }
  });

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
