const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const problemService = require('../services/problemService');

//get all problems
router.get('/problems', (req, res) => {
	problemService.getProblems()				//this function returns a promise
		.then(problems => res.json(problems));//"then" means what to do if promise acheives
});	//res.json(problems): return problems to the caller

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

module.exports = router;
