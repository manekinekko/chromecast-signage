var mdsn 									= false;
var devices 							= [];
var applications 					= [];
var expressPort 					= process.env.PORT || 8001;
var socketPort 						= 8002;
var API 									= 'http://localhost:'+expressPort+'/api';
var content 							= require('./content');
var root 									= './';
var uploadDir 						= root+'/uploads/';

var multipart 						= require('connect-multiparty');
var cast2tv 							= require('castv2-client');
var Client                = cast2tv.Client;
var DefaultMediaReceiver  = cast2tv.DefaultMediaReceiver;
var mdns                  = require('mdns');
var browser 							= mdns.createBrowser(mdns.tcp('googlecast'));
var express    						= require('express');
var app        						= express();
var bodyParser 						= require('body-parser');
var timeout 							= require('express-timeout');
var cors 									= require('express-cors');
var io 										= require('socket.io')(socketPort);
console.log('Socket.io started on port %s', socketPort);

// SOCKET.IO SETUP
// =============================================================================
io.on('connection', function(socket){
  
  socket.emit('api.devices.update', getDevicesList());

	// mDNS SETUP
	// =============================================================================
	browser.on('serviceUp', function(service) {
	  console.log('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
		devices.push(service);

	  socket.emit('api.devices.update', getDevicesList());
	});

	browser.on('serviceDown', function(service) {
	  console.log("service down: ", service);
	  devices = devices.filter(function(device){
	  	return device.name !== service.name;
	  });

	  socket.emit('api.devices.update', getDevicesList());
	});


	// START THE mDNS DISCOVERY
	// =============================================================================
	if(!mdsn){
		browser.start();
		console.log('mDNS started');
		mdsn = true;
	}

});

function launchMedia(host, type, links) {

	var link = links[0];

	console.log('launching media at %s - %s (%s)', host, type, link.name)

	var client = new Client();

  client.connect(host, function() {
    console.log('connected, launching app ...');

    client.launch(DefaultMediaReceiver, function(err, player) {

    	applications.push(player);

    	var media = null;
    	if (type === 'custom' && link){
    		// var mm = mime.lookup(link);
    		var mm = link.file.split(',')[0].split(';')[0].split(':')[1];
    		media = content.custom[mm.split('/')[0]];
    		media.contentId = link.file;
				media.contentType = mm;
				media.metadata.title = link.name;
    	}
    	else {
    		media = content[type];
    	}
      player.on('status', function(status) {
        console.log('status broadcast playerState=%s', status.playerState);
      });

      console.log('app "%s" launched, loading media \n%s ...', player.session.displayName, media.name);

      player.load(media, { autoplay: true }, function(err, status) {

    		if(err){
    			console.log(err);
    		}
    		else {

	        console.log('media loaded playerState=%s', status.playerState);

    		}

      });

    });

  });

  client.on('error', function(err) {
    console.log('Error: %s', err.message);
    client.close();
  });

}

function stopMedia(host){

	applications.forEach(function(app){
		app.close();
	});

	applications = [];

}

function getDevicesList(){
	return {
		'xlink': {
			'play': {
				'image': API+'/devices/-/play/image',
				'video': API+'/devices/-/play/video',
				'custom': API+'/devices/-/play/custom'

			},
			'stop': API+'/devices/-/stop'
		},
		'devices': devices.map(function(device){
			device.xlink = {
				'play': {
					'image': API+'/devices/'+device.fullname+'/play/image',
					'video': API+'/devices/'+device.fullname+'/play/video',
					'custom': API+'/devices/'+device.fullname+'/play/custom'
				},
				'stop': API+'/devices/'+device.fullname+'/stop'
			};
			return device;
		})
	};
}

// EXPRESS SETUP
// =============================================================================
app.use(bodyParser.urlencoded({ 
	extended: true, 
	limit: '10mb' 
}));
app.use(bodyParser.json({
	limit: '10mb'
}));
app.use(multipart({
	uploadDir: uploadDir
}));
app.use('/uploads', express.static(__dirname + '/uploads'));
// app.use(cors({allowedOrigins: ['http://localhost:8000']}));
// app.use(session({secret: 'secret'}));

// EXPRESS ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

router.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  res.header('Access-Control-Allow-Methods', 'Options, Post, Get');
	next();
});

// !!! stream response
router.get('/devices', function(req, res) {

	res.send(getDevicesList());

});


function playAll(req, res) {
	try {

		devices.forEach(function(service){
		  console.log('PLAY ALL -- found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
			launchMedia(service.addresses[0],  req.params.media || 'custom', req.body.links);
		});

		res.send({'xlink': {
			'stop': API+'/devices/-/stop',
			'devices': API+'/devices'
		}});
		
	}
	catch(err){
		res.send({ 'error': err });
	}
}
router.get('/devices/-/play/:media', playAll);
router.post('/devices/-/play/:media', playAll);

router.get('/devices/-/stop', function(req, res) {
	try {

		devices.forEach(function(service){
		  console.log('STOP ALL -- found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
			stopMedia(service.addresses[0]);
		});
		
		res.send({'xlink': {
			'play': {
				'image': API+'/devices/-/play/image',
				'video': API+'/devices/-/play/video',
				'custom': API+'/devices/-/play/custom'
			},
			'devices': API+'/devices'
		}});
		
	}
	catch(err){
		res.send({ 'error': err });
	}
});

function playDevice(req, res) {
	try {

		devices
			.filter(function(device){
				return device.fullname === req.params.name;
			})
			.forEach(function(service){
			  console.log('PLAY -- found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
				launchMedia(service.addresses[0], req.params.media || 'custom', req.body.links);
			});

		res.send({'xlink': {
			'stop': API+'/devices/'+req.params.name+'/stop',
			'devices': API+'/devices'
		}});
		
	}
	catch(err){
		console.log(err)
		res.send({ 'error': err });
	}
}
router.get('/devices/:name/play/:media', playDevice);
router.post('/devices/:name/play/:media', playDevice);

router.get('/devices/:name/stop', function(req, res) {
	try {

		devices
			.filter(function(device){
				return device.fullname === req.params.name;
			})
			.forEach(function(service){
			  console.log('STOP -- found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
				stopMedia(service.addresses[0]);
			});
		
		res.send({'xlink': {
			'play': {
				'image': API+'/devices/'+req.params.name+'/play/image',
				'video': API+'/devices/'+req.params.name+'/play/video',
				'custom': API+'/devices/'+req.params.name+'/play/custom'
			},
			'devices': API+'/devices'
		}});
		
	}
	catch(err){
		res.send({ 'error': err });
	}
});

router.post('/upload', function(req, res){

	res.send({
		'xlink': 'http://localhost:8001/'+req.files.file.path,
		'name': req.files.file.name
	});
});

// REGISTER OUR ROUTES
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE EXPRESS SERVER
// =============================================================================
app.listen(expressPort, '0.0.0.0');
console.log('Express on port ' + expressPort);
