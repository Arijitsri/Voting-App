const mongoose = require('mongoose');
const { type } = require('os');
//const bcrypt = require('bcrypt');

// Define the Candidate Schema
const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    party: {
        type:String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    votes: [
        {
            user:{
                type: mongoose.Schema.ObjectId,
                ref: 'User',
                required: true
            },
            VotedAt : {
                type : Date,
                default: Date.now()
            }
        }
    ],
    voteCount: {
        type: Number,
        default: 0
    }
});

const Candidate = mongoose.model('Candidate', candidateSchema);
module.exports = Candidate;