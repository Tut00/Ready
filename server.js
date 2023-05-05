if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express')
const path = require('path')
const bcrypt = require('bcrypt')
const passport = require('passport')
const initilaizePassport = require('./passport-config')
const flash = require('express-flash')
const session = require('express-session')
const port = 3001
const mongoose = require('mongoose')
const User = require('./models/user')


uri = 'mongodb+srv://admin:admin@cluster0.moh5hyj.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(uri);

initilaizePassport(passport, async (email) => {
   const result = await User.find({email: email}) 
   return result[0];
})

// async function getMes() {
//     try {
//         const result = await client.db("appDB").collection("users").findOne({email: 'mtalkhnani@hotmail.com'})
//         console.log(result) 
//     } catch (error){
//         console.error(error)
//     } finally {
//         setTimeout(() => {client.close()}, 1500)
//     }
// }

// async function listDatabases(client) {
//     const databaseList = await client.db().admin().listDatabases();
//     databaseList.databases.forEach(element => {
//         console.log(element);
//     });
// }

// async function addUserToDB(client, user){
//     const result = await client.db("appDB").collection("users").insertOne(user)

//     console.log('new user add with the id of ' + result.insertedId)
// }
const app = express()
// app.set('views', path.join(__dirname, 'views'));
// app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html')
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(flash())
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'ejs');

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    } else {
      res.redirect('/login');
    }
  }

  app.get('/', ensureAuthenticated, async (req, res) => {
    // console.log(req.user instanceof mongoose.Model);
    res.render('home', { user: req.user });
  });
  
app.get('/login', (req, res) => {
    res.render('login.ejs')
})
app.post('/login',  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))
app.get('/register', (req, res) => {
    res.render('register.ejs')
})
app.post('/register', async (req, res) => {
    const user = await User.findOne({
        email: req.body.email
      })

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10) //hashing the password
        //now we push the user to the database
        // console.log(req.body.name)
        // console.log(req.body.phone)
        // console.log(req.body.email)
        // console.log(req.body.password)
        // console.log(hashedPassword)
        if (user) {
            req.flash('error', 'Sorry, that name is taken. Maybe you need to <a href="/login">login</a>?');
            res.redirect('/register');
          } else if (req.body.email == "" || req.body.password == "") {
            req.flash('error', 'Please fill out all the fields.');
            res.redirect('/register');
          } else {
            const user = new User({
                name: req.body.name,
                phone: req.body.phone,
                email: req.body.email,
                password: hashedPassword,
                orders: [],
                wishlist: []
                })
        
                await user.save() // saving the user to DB
        
                console.log("user add to the database")
                res.redirect('/login')
          }

    } catch (error){
        console.error(error.message)
        res.redirect('/register')
    } 
})

app.get('/contactUs', (req, res) => {
    res.render('contactUs.ejs')
})

app.get('/wishlist', ensureAuthenticated, (req, res) => {
    res.render('wishlist.ejs')
})
app.get('/cart', ensureAuthenticated, (req, res) => {
    res.render('cart.ejs')
})

app.get('/books', (req, res) => {
    res.render('books.ejs')
})

app.get('/book', (req, res) => {
    res.render('book.ejs')
})

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });
  
app.listen(port, () => {
    console.log("Server is listening to port  " + port)
    console.log("go to browser and type in the url localhost:" + port)
})