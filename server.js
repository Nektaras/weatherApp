import express from 'express';
import fetch from 'node-fetch';
import { MongoClient } from 'mongodb';
import cors from 'cors';
import fs from 'fs';
import bp from 'body-parser';

let app = express();
app.use(cors());
app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

let db;
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const API_key = "d43125b9a05afc062bda72694d1ea670";

client.connect(err => {
    if (err) return console.log(err);
    app.listen(3000, () => console.log('API started'));
});

app.get('/city/:name', (req, res) => {
    db = client.db("allCities");
    db.collection('cities').count(async function (err, count) {
        if (!err && count === 0) {
            let cityData = fs.readFileSync('city.list.json');
            let cities = JSON.parse(cityData);
            await db.collection('cities').insertMany(cities);
        }
        db.collection('cities').find({"name": req.params.name}).toArray((err, result) => {
            if (err) {
                console.log(err);
                return res.sendStatus(500);
            }
            res.json({ result });
        });
    });
});

app.get('/:lat,:lon', async (req, res) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${req.params.lat}&lon=${req.params.lon}&appid=${API_key}&units=metric`;
    const response = await fetch(url)
        .then(res => res.json())
        .catch(e => {
            console.error({
                "message": "OH NO",
                error: e,
            })
        })
    res.json({
        "city": response.name,
        "country": response.sys.country,
        "weather": response.weather[0].description,
        "icon": response.weather[0].icon,
        "temperature": Math.round(response.main.temp),
        "wind": Math.round(response.wind.speed)
    });
});

app.get("/myCities", (req, res) => {
    let myCityArray = [];
    db = client.db("myCities");
    db.collection('cities').find().toArray(async (err, result) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }

        for (let i = 0; i < result.length; i++) {
            const url = `https://api.openweathermap.org/data/2.5/weather?id=${result[i].id}&appid=${API_key}&units=metric`;
            const response = await fetch(url)
                .then(res => res.json())
                .catch(e => {
                    console.error({
                        "message": "OH NO",
                        error: e,
                    })
                })
            myCityArray.push({
                "id": response.id,
                "city": response.name,
                "country": response.sys.country,
                "weather": response.weather[0].description,
                "icon": response.weather[0].icon,
                "temperature": Math.round(response.main.temp),
                "wind": Math.round(response.wind.speed)
            });
        }
        res.send(myCityArray);
    });
});

app.post('/', (req, res) => {
    db = client.db("myCities");
    let city = {
        id: req.body.id
    };
    db.collection('cities').insertOne(city, (err, result) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.status(200).json(city);
    })
});

app.delete('/:id', (req, res) => {
    db = client.db("myCities");
    db.collection('cities').deleteOne({ "id": req.params.id }, (err, result) => {
        if (err) {
            console.log(err);
            return res.sendStatus(500);
        }
        res.status(200).json(result);
    });
});