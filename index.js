const express = require('express')
const axios = require('axios')
const app = express()
const port = 3001

const url = 'https://www.yammer.com/api/v1/users/current.json'

app.get('/', function (req, res) {
  	res.send('Hello World!')
})

app.get('/user', function (req, res) {
	console.log(req.query.token)
	axios.defaults.headers.common['Authorization'] = req.query.token;
	axios.get(url)
		.then(json => res.send({ id: json.data.id, full_name: json.data.full_name }))
		.catch(error => res.send({ id: null, full_name: null }))
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))



