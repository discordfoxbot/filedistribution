var express = require('express');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var multer = require('multer');
var shortid = require('shortid');
var mime = require('mime-types');

var config = require('./config');

var deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

deleteFolderRecursive(__dirname + '/cache/upload');


var upload = multer({dest: __dirname + '/cache/upload', limits: {fieldSize: 1e+8}});
var app = express();

shortid.seed(32);

app.get('/', function (req, res) {
    res.redirect(config.urls.base_redirect);
});

app.post('/upload', upload.single('data'), function (req, res) {
    if (req.get('X-Auth-fue') === config.auth_token) {
        var name = shortid.generate();
        var type = mime.extension(req.file.mimetype);
        if (type === false) {
            var split = originalname.trim().split('.');
            type = split[split.length - 1];
        }
        fs.readFile(req.file.path, function (err, file) {
            if (!err) {
                fs.writeFile(__dirname + '/public/' + name + '.' + type, file, function (err) {
                    if (!err) {
                        res.status(201).json({loc: config.urls.cdn + name + '.' + type});
                    } else {
                        console.log(err, 2);
                        res.status(500).send('Internal upload error.');
                    }
                });
            } else {
                console.log(err, 1);
                res.status(500).send('Internal upload error.');
            }
        });
    } else {
        res.status(401).send('Unauthorized! Send authorization header!');
    }
});

app.use(function (req, res) {
    res.status(404).send('File not found!');
});

app.listen(config.port);
