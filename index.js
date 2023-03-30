if( process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const session = require('express-session');
const PORT = process.env.PORT || 3000;
global.DEBUG = true;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.listen(PORT, (err) => {
    if (err) console.log(err);
    console.log(`Simple app running on port ${PORT}.`)
});

app.get('/', async (req, res) => {
    res.render('index', {status: app.locals.status});
});

app.get('/about', async (req, res) => {
    res.render('about', {status: app.locals.status});
});

const authRouter = require('./routes/auth')
app.use("/auth", authRouter);

app.use((req, res) => {
    res.status(404).render('404', {status: app.locals.status});
});

