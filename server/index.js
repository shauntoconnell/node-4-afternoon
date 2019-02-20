const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const {SESSION_SECRET, SERVER_PORT} = process.env;

const app = express();
app.use(bodyParser.json());
app.use(session({
	secret: SESSION_SECRET,
	saveUninitialized: true,
	resave: false
}));

app.get('/callback', (req, res) => {
	const {REACT_APP_AUTH0_CLIENT_ID, REACT_APP_AUTH0_CLIENT_SECRET, REACT_APP_AUTH0_DOMAIN} = process.env;
	const {AUTH0_API_CLIENT_ID, AUTH0_API_CLIENT_SECRET} = process.env;

	const payload = {
		client_id: REACT_APP_AUTH0_CLIENT_ID,
		client_secret: REACT_APP_AUTH0_CLIENT_SECRET,
		redirect_uri: `http://${req.headers.host}/callback`,
		grant_type: 'authorization_code',
		code: req.query.code
	}

	function exchangeCodeForAccessToken() {
		return axios.post(`https://${REACT_APP_AUTH0_DOMAIN}/oauth/token`, payload)
	}

	function exchangeAccessTokenForUserInfo(accessTokenResponse) {
		const accessToken = accessTokenResponse.data.access_token;
		return axios.get(`http://${REACT_APP_AUTH0_DOMAIN}/userinfo/?access_token=${accessToken}`)
	}

	function setUserToSessionGetAuthAccessToken(userInfoResponse) {
		req.session.user = userInfoResponse.data;

		body = {
			client_id: AUTH0_API_CLIENT_ID,
			client_secret: AUTH0_API_CLIENT_SECRET,
			audience: `https://${REACT_APP_AUTH0_DOMAIN}/api/v2/`,
			grant_type: 'client_credentials'
		}

		return axios.post(`https://${REACT_APP_AUTH0_DOMAIN}/oauth/token`, body)
	}

	function getGitAccessToken(authAccessTokenResponse) {
		const {sub} = req.session.user;
		const {access_token} = authAccessTokenResponse.data;

		const options = {
			headers: {authorization: `Bearer ${access_token}`}
		};

		return axios.get(`https://${REACT_APP_AUTH0_DOMAIN}/api/v2/users/${sub}`, options);
	}

	function setGitTokenToSessions(gitAccessToken) {
		req.session.access_token = gitAccessToken.data.identities[0].access_token;
		res.redirect('/');
	}

	exchangeCodeForAccessToken()
	.then(accessTokenResponse => exchangeAccessTokenForUserInfo(accessTokenResponse))
	.then(userInfoResponse => setUserToSessionGetAuthAccessToken(userInfoResponse))
	.then(authAccessTokenResponse => getGitAccessToken(authAccessTokenResponse))
	.then(gitAccessToken => setGitTokenToSessions(gitAccessToken))
	.catch(error => console.log(error));
})

app.get('/api/star', (req, res) => {
	const {access_token} = req.session;
	const {gitUser, gitRepo} = req.query;

	axios.put(`https://api.github.com/user/starred/${gitUser}/${gitRepo}?access_token=${access_token}`)
	.then(() => {
		console.log('hit');
		res.status(200).end();
	}).catch(error => console.log(error.data));
});

app.get('/api/unstar', (req, res) => {
	const {access_token} = req.session;
	const {gitUser, gitRepo} = req.query;

	axios.delete(`https://api.github.com/user/starred/${gitUser}/${gitRepo}?access_token=${access_token}`)
	.then(res.status(200).end()).catch(err => console.log(err));
});

app.get('/api/user', (req, res) => {
	res.status(200).json(req.session.user)
});

app.get('/api/logout', (req, res) => {
	req.session.destroy();
	res.send('Logged out successfully!');
});

app.listen(SERVER_PORT, () => {
	console.log(`Server listening on port ${SERVER_PORT}...`);
});