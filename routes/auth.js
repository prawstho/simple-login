const express = require('express');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const router = express.Router();

const { addLogin, getLoginByUsername } = require('../services/p.auth.dal')
// const { addLogin, getLoginByUsername } = require('../services/m.auth.dal')

router.use(express.static('public'));

router.get('/', async (req, res) => {
    if(DEBUG) console.log('login page: ');
    res.render('login', {status: req.app.locals.status});
    return;
});

router.post('/', async (req, res) => {
    try {
        if(DEBUG) console.log('auth.getLoginByUsername().try');
        let user = await getLoginByUsername(req.body.username);
        if(DEBUG) console.log(`user data: ${user}`);
        if(user === undefined) {
            req.app.locals.status = 'Incorrect user name was entered.'
            if(DEBUG) console.log(req.app.locals.status);
            res.redirect('/auth');
            return;
        }
        if( await bcrypt.compare(req.body.password, user.password)) {
            // change using app.locals to use session or java web token (jwt)
            req.app.locals.user = user;
            req.app.locals.status = 'Happy for your return ' + user.username;
            res.redirect('/');
            return;
        } else {
            req.app.locals.status = 'Incorrect password was entered.'
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
    res.render('register', {status: req.app.locals.status});
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
            if(result.code === "23505" || result === 11000) {
                let constraint;
                if(result.constraint === "unique_username") 
                    constraint = "Username";
                if(result.constraint === "unique_email") 
                    constraint = "Email address";
                if(DEBUG) console.log(`${constraint} already exists, please try another.`);
                req.app.locals.status = `${constraint} already exists, please try another.`
                res.redirect('/auth/new')
                return;
            } else {
                req.app.locals.status = 'New account created, please login.'
                res.redirect('/auth');
                return;
            }
        } else {
            if(DEBUG) console.log('Not enough form fields completed.');
            req.app.locals.status = 'Not enough form fields completed.'
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
    req.app.locals.status = ' ';
    res.redirect('/');
    return;
});

module.exports = router