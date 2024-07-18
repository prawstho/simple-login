const express = require('express');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const router = express.Router();

const { addLogin, getLoginByUsername } = require('../services/p.auth.dal')
// const { addLogin, getLoginByUsername } = require('../services/m.auth.dal')

router.use(express.static('public'));

router.get('/', async (req, res) => {
    if(DEBUG) console.log('login page: ');
    res.render('login', {status: req.session.status});
    // res.render('login', {status: req.app.locals.status});
    return;
});

router.post('/', async (req, res) => {
    try {
        if(DEBUG) console.log('auth.getLoginByUsername().try');
        let user = await getLoginByUsername(req.body.username);
        if(DEBUG) console.log(`user data: ${user.username}`);
        if(user === undefined || user === null) {
            req.session.status = 'Incorrect user name was entered.'
            // req.app.locals.status = 'Incorrect user name was entered.'
            if(DEBUG) console.log(req.session.status);
            res.redirect('/auth');
            return;
        }
        if( await bcrypt.compare(req.body.password, user.password)) {
            // change using app.locals to use session or json web token (jwt)
            req.session.user = user;
            req.session.status = 'Happy for your return ' + user.username;
            res.redirect('/');
            return;
        } else {
            req.session.status = 'Incorrect password was entered.'
            res.redirect('/auth')
            return;
        }
    } catch (error) {
        console.log(error);
        if(DEBUG) console.log('auth.getLoginByUsername().catch: ' + user.username);
        // log this error to an error log file.
        res.render('503');
        return;
    }
});

// from http browser it has /auth/new
router.get('/new', async (req, res) => {
    res.render('register', {status: req.session.status});
    return;
});

router.post('/new', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        if (req.body.email && req.body.username && req.body.password ) {
            var result = await addLogin(req.body.username, req.body.email, hashedPassword, uuid.v4());
            if(DEBUG) console.log('result: ' + result);
            // duplicate username, comes from uniqueness constraint 
            // in postgresql(err.code=23505) OR mongodb(err.code=11000)
            if(result.code === "23505" || result.code === 11000) {
                let constraint;
                function setConstraint(indexName) {
                    const constraintsMap = {
                        "unique_username": "Username",
                        "unique_email": "Email address"
                    };
                    return constraintsMap[indexName] || indexName; // Default to indexName if not found
                }
                
                if (result.code === "23505") { // PostgreSQL unique violation
                    constraint = setConstraint(result.constraint);
                } else if (result.code === 11000) { // MongoDB duplicate key error
                    if (DEBUG) console.log(result.errmsg);
                    const match = result.errmsg.match(/index: (\w+)/);
                    const indexName = match ? match[1] : 'unknown';
                    if (DEBUG) console.log(`Duplicate key error for index: ${indexName}`);
                    constraint = setConstraint(indexName);
                }
                if(DEBUG) console.log(`${constraint} already exists, please try another.`);
                req.session.status = `${constraint} already exists, please try another.`
                res.redirect('/auth/new')
                return;
            } else {
                req.session.status = 'New account created, please login.'
                res.redirect('/auth');
                return;
            }
        } else {
            if(DEBUG) console.log('Not enough form fields completed.');
            req.session.status = 'Not enough form fields completed.'
            res.redirect('/auth/new')
            return;
        }       
    } catch (error) {
        console.log(error);
        // log this error to an error log file.
        res.render('503');
        return;
    }
});

router.get('/exit', async (req, res) => {
    if(DEBUG) console.log('get /exit');
    // clear out the express-session
    req.session.destroy((err) => {
        if (err) {
            // Handle error case
            console.error("Session destruction error:", err);
            return res.status(500).send("Could not log out.");
        } else {
            // Redirect to home page or login page after successful logout
            res.redirect('/');
            return;
        }
    });
});

module.exports = router