const express = require('express')
const axios = require('axios')
const app = express()
const port = 3001
const assert = require('assert')
const MongoClient = require('mongodb').MongoClient

const userUrl = 'https://www.yammer.com/api/v1/users/current.json'
const messageUrl = 'https://www.yammer.com/api/v1/messages?group_id=17808026&format=json&body='
const database_url = 'mongodb://localhost:27017'

MongoClient.connect(database_url, { useNewUrlParser: true })
    .then(client => {
        const db = client.db('shamehat');
        const victims = db.collection('victims');
        const givers = db.collection('givers');
        app.locals.givers = givers;
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

app.get('/givers', function (req, res) {
    const givers = req.app.locals.givers;
    const cursor = givers.find({})
    cursor.toArray(function(err, docs) {
        console.log(docs);
        res.send(docs);
    })  
})

async function updateDB(req, res, userJson, messageJson) {
    // update victims collection
    const victims = req.app.locals.victims;
    await victims.updateOne(
        { id: userJson.data.id },
        {
            $set: { 'name': userJson.data.full_name, lastTime: (new Date()).getTime() },
            $inc: { 'times': 1 }
        },
        {
            upsert: true
        }
    );

    // get all (updated) victims
    const cursor = victims.find({})
    cursor.toArray(async function(err, rec) {
        console.log(err)

        // update givers collection
        const givers = req.app.locals.givers;
        await givers.updateOne(
            { name: req.query.giver },
            {
                $inc: { 'times': 1 }
            },
            {
                upsert: true
            }
        );

        // get all (updated) givers
        const cursor = givers.find({})
        cursor.toArray(function(err, giv) {
            console.log(err)

            // send result
            var message = null
            if (messageJson) {
                message = messageJson.data.messages[0].web_url
            }
            res.send({ full_name: userJson.data.full_name, messageUrl: message, receivers: rec, givers: giv });
        })
    }) 
}

app.get('/user', function (req, res) {
    console.log(req.query.giver + ", " + req.query.token)
    axios.defaults.headers.common['Authorization'] = req.query.token;
    
    // get user info
    axios.get(userUrl)
        .then(async function (userJson) {
        
            // post message (if exists)
            if (req.query.message !== null) {
                axios.post(messageUrl+encodeURIComponent(req.query.message))
                    .then( async function(messageJson) {
                        updateDB(req, res, userJson, messageJson)
                    })
            } else {
                updateDB(req, res, userJson, null)
            }
        })
        .catch(error => res.send({ full_name: null, data: null }))
})


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

