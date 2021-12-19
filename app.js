var createError = require('http-errors');
var express = require('express');
const { engine:hbs } = require('express-handlebars');
var path = require('path');
require('dotenv').config()

// var hbs=require("express-handlebars");
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// var handlebars=require('express-handlebars');
var session =require('express-session')
var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');


// app.use("view engine", "hbs")
var app = express();


var fileupload=require('express-fileupload')
app.use(fileupload())
// const {engine:hbs}=require('express-handlebars')


var db=require('./config/connection');
      
// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set("views", "./views");
app.set('view engine', 'hbs');


app.engine('hbs', hbs({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret:"Key",cookie:{maxAge:7000000}}))
app.use('/', userRouter);
app.use('/admin', adminRouter);

   
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

db.connect((err)=>{
  if(err) console.log("database connection Err"+err);

  else console.log("database connected");
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;