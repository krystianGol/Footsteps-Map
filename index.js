import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;
const dataBaseName = process.env.DataBaseName;
const dataBasePassword = process.env.DataBasePassword;
const dataBasePort = process.env.DataBasePort;

let visited_countries = [];
let countries_codes = [];

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: dataBaseName,
  password: dataBasePassword,
  port: dataBasePort
});

db.connect();

db.query("SELECT * FROM visited_countries", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    visited_countries = res.rows;
  }
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {

  visited_countries.forEach(country => {
    countries_codes.push(country.country_code);
  });

  res.render("index.ejs",
    {
      total: visited_countries.length,
      countries: countries_codes
    });
});

app.post("/add", async (req, res) => {
  let inputCountry = req.body.country;
  let isVisited = false;
  inputCountry = inputCountry.charAt(0).toUpperCase() + inputCountry.slice(1).toLowerCase();

  const result = await db.query("SELECT * FROM countries WHERE country_name LIKE $1 || '%'", [inputCountry]);

  if (result.rows.length != 0) {
    visited_countries.forEach(country => {
      if (country.country_code === result.rows[0].country_code) {
        console.log(country.country_code, result.rows[0].country_code);
        isVisited = true;
      }
    })
  }

  if (result.rows.length === 0) {
    res.render("index.ejs",
      {
        error: "Country name does not exist, try again",
        total: visited_countries.length,
        countries: countries_codes
      });
  } else if (isVisited) {
    res.render("index.ejs",
      {
        error: "Country has already been added, try again",
        total: visited_countries.length,
        countries: countries_codes
      });
  } else {
    const data = result.rows[0];
    visited_countries.push(data);
    const country_code = data.country_code;

    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code]);

    res.redirect("/");
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
