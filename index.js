const express = require('express')
const axios = require('axios')
const app = express()
const port = 3001
const assert = require('assert')
const MongoClient = require('mongodb').MongoClient

const url = 'https://www.yammer.com/api/v1/users/current.json'
const database_url = 'mongodb://localhost:27017'

MongoClient.connect(database_url, { useNewUrlParser: true })
    .then(client => {
        const db = client.db('shamehat');
        const victims = db.collection('victims');
        app.locals.victims = victims;
}).catch(error => console.log(error));

app.get('/', function (req, res) {
    console.log('Hello World!')
    res.send('Hello World!')
})

app.get('/receivers', function (req, res) {
    const victims = req.app.locals.victims;
    const cursor = victims.find({})
    cursor.toArray(function(err, docs) {
        console.log(docs);
        res.send(docs);
    })  
})

app.get('/user', function (req, res) {
    console.log(req.query.token)
    axios.defaults.headers.common['Authorization'] = req.query.token;
    axios.get(url)
        .then(async function (json) {
            const victims = req.app.locals.victims;
            await victims.updateOne(
                { id: json.data.id },
                {
                    $set: { 'name': json.data.full_name, lastTime: (new Date()).getTime() },
                    $inc: { 'times': 1 }
                },
                {
                    upsert: true
                }
            );
            const cursor = victims.find({})
            cursor.toArray(function(err, docs) {
                console.log(err)
                res.send({ full_name: json.data.full_name, data: docs });
            }) 
        })
        .catch(error => res.send({ full_name: null, data: null }))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

