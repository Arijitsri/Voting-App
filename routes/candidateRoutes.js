const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Candidate = require('../models/candidate');
const {jwtAuthMiddleware, generateToken} = require('../jwt');

// Checking if person is admin or not so that anyone else can not access these routes
const checkAdminRole = async (userId)=>{
    try {
        const user = await User.findById(userId);
        return user.role === 'admin';
    } catch(err) {
        return false;
    }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware,async(req, res)=>{
    try{
        if(! await checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'User has not admin role'});
        }
        const data = req.body; // Asssuming the request body contains candidate data               
        
        // Create a new candidate document using the mongoose model
        const newCandidate = new Candidate(data);
        
        // Save the new candidate to the database
        const response = await newCandidate.save();
        console.log('Data saved');
        
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})


router.put('/:candidateId', jwtAuthMiddleware, async (req, res)=>{
    try {
        if(! await checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'User has not admin role'});
        }
        
        const candidateId = req.params.candidateId; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true,   // Run mongoose validation 
        });

        if(!response){
            res.status(404).json({error: 'Candidate not found'});
        }

        console.log('Candidate data updated');
        res.status(200).json(response);
    } catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})

router.delete('/:candidateId', jwtAuthMiddleware, async (req, res)=>{
    try {
        if(! await checkAdminRole(req.user.id)){
            return res.status(403).json({message: 'User has not admin role'});
        }
        
        const candidateId = req.params.candidateId; // Extract the id from the URL parameter

        const response = await Candidate.findByIdAndDelete(candidateId);

        if(!response){
            res.status(404).json({error: 'Candidate not found'});
        }

        console.log('Candidate deleted');
        res.status(200).json(response);
    } catch (err){
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})


// Start voting
router.post('/vote/:candidateId', jwtAuthMiddleware, async(req, res)=>{
    // no admin can vote
    // user can vote only once

    const candidateId = req.params.candidateId;
    const userId = req.user.id;

    try {
        // Find the candidate with the specified candidateId
        const candidate = await Candidate.findById(candidateId);
        if(!candidate){
            return res.status(404).json({message: 'Candidate not found'});
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }

        if(user.isVoted){
            return res.status(400).json({message: 'You have already voted'});
        }

        if(user.role == 'admin'){
            return res.status(403).json({message: 'Admin not allowed to vote'});
        }

        // Update the candidate document to record the vote
        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        // Update the user document
        user.isVoted = true;
        user.save();

        res.status(200).json({message: 'Vote recorded successfully'});

    }catch (err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})


// Vote count
router.get('/vote/count', async(req, res)=>{
    try {
        // Find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and vote count
        const voteRecord = candidate.map((data)=>{
            return{
                party: data.party,
                count: data.voteCount
            }
        })

        return res.status(200).json(voteRecord);

    } catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error'});
    }
})

// Get List of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;