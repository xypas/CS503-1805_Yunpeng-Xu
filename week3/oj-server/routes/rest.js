const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const problemService = require('../services/problemService');

const nodeRestClient = require('node-rest-client').Client;

// for server to call the RESTful API
const restClient = new nodeRestClient()

// Python Flask server listen on port 5000 by default
// for executor
EXECUTE_SERVER_URL = 'http://executor/build_and_run';
// this build and run is for executor
restClient.registerMethod('build_and_run', EXECUTE_SERVER_URL,'POST')

//get all problems
router.get('/problems', (req, res) => {
	problemService.getProblems()
		.then(problems => res.json(problems));//"then" means what to do if promise acheives
});

// get single problem
router.get('/problems/:id', (req, res) => {
	const id = req.params.id;
	problemService.getProblem(+id) //+ transfer string to integer
		.then(problem => res.json(problem));
});

// add a problem
router.post('/problems', jsonParser, (req, res)=>{
	problemService.addProblem(req.body)
		.then(problem => {
			res.json(problem);
		},  error => {
			res.status(400).send('Problem name already exists') //400 means error status
		});
});

// modeify a problem
router.put('/problems', jsonParser, (req, res) => {
	problemService.modProblem(req.body)
		.then(problem => {
			res.json(problem);
		}, error => {
			res.status(400).send('failed to modify problem')
		})
})

// jsonParser: middleware, used to parse the body of the POST request
// this build and run method was requested fro oj-client, req = request from oj-client
//res = response to oj-client
router.post('/build_and_run', jsonParser, (req,res) => {
	const code = req.body.code;
	const lang = req.body.lang;

	console.log('lang: ',lang, 'code:', code);
	// this build is an API on executor
	restClient.methods.build_and_run(
	{
		data:{code:code,lang:lang},
		headers:{'Content-Type': 'application/json'}
	},
	// data and response are from the executor, 
	(data,response) => {
		// response: raw data, data: parsed response
		const text = `Build output: ${data['build']},execute output: ${data['run']}`;
		//we packaged the result from executor, and send back to oj-client
		res.json(text);
	}
	)
});

module.exports = router;
