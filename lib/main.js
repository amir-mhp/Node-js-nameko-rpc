const cors = require( "cors" );
const bodyParser = require( "body-parser" );
const express = require( "express" );
const path = require( "path" );
const logger = require( "morgan" );
const http = require( "http" );

const winston = require( 'winston-color' );
const nameko = require( "./nameko" );

class Main
{
	static _instance;

	allowAddress = [];
	httpServer = null;

	static getInstance ( app, mongooseDb )
	{
		if ( this._instance )
		{
			winston.info( '... Prevent declaring main class, return it ..' );
			return this._instance;
		}

		if ( !app )
			app = express()


		this._instance = new Main( app, mongooseDb );
		return this._instance;
	}

	constructor ( app )
	{
		this.app = app;

		this.init()
	}

	init ()
	{
		this.addSetting()
		this.addAccessControllerHeader()
	}

	async getRpc ()
	{
		return await nameko.connect( { host : process.env.RABBIT_HOST, port : process.env.RABBIT_PORT } )
	}


	appGetter ()
	{
		return this.app
	}


	createServer ()
	{
		this.httpServer = http.createServer( this.app );

		return this.httpServer
	}

	addSetting ()
	{
		this.app.disable( 'etag' );
		this.app.use( cors( this._corsOptionsDelegate ) );
		this.app.use( bodyParser.json() );
		this.app.use( bodyParser.urlencoded( { extended : true } ) );
		this.app.use( express.json() );
		this.app.use( express.static( path.join( __dirname, 'app/public' ) ) );
		this.app.use(
			logger( 'dev' )
		);
	}

	addAccessControllerHeader ()
	{
		this.app.use( function ( req, res, next )
		{
			res.header( "Access-Control-Allow-Origin", "*" );
			res.header( 'Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS' );
			res.header( "Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials" );
			res.header( "Access-Control-Allow-Credentials", "true" );
			next();
		} );
	}

	_corsOptionsDelegate = ( req, callback ) =>
	{
		let corsOptions;
		let isDomainAllowed = ( ( this.allowAddress.indexOf( req.header( 'Origin' ) ) !== -1 ) || ( 1 === 1 ) );
		let isExtensionAllowed = req.path.endsWith( '.jpg' );

		if ( isDomainAllowed && isExtensionAllowed )
		{
			corsOptions = { origin : true }
		}
		else
		{
			corsOptions = { origin : false }
		}
		callback( null, corsOptions )
	};

}

module.exports = Main;