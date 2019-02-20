import React, { Component } from 'react';
import axios from 'axios';
import './App.css';

class App extends Component {
	constructor(props) {
		super(props);

		this.state = {
			user: '',
			gitUser: '',
			gitRepo: 'node-4-afternoon',
			starred: 'star',
			message: 'Please Login'
		}
	}

	componentDidMount() {
		axios.get('/api/user').then(user => {
			console.log(user);
			this.setState({
				user: user.data,
				gitUser: user.data.nickname		// why not just access from state user obj?
			});
		});
	}

	login = () => {
		const {REACT_APP_AUTH0_DOMAIN, REACT_APP_AUTH0_CLIENT_ID} = process.env;
		const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);

		window.location = `https://${REACT_APP_AUTH0_DOMAIN}/authorize
			?client_id=${REACT_APP_AUTH0_CLIENT_ID}
			&scope=openid%20profile%20email
			&redirect_uri=${redirectUri}
			&response_type=code`;
	}

	logout = () => {
		axios.get('/api/logout').then(response => {
			this.setState({ message: response.data, user: '' });
		});
	}

	changeHandler = (key, value) => {
		this.setState({
			[key]: value,
			// starred: 'star'	<-- unclear on purpose
		})
	}

	star = () => {
		if (this.state.starred === 'star') {
			this.setState({ starred: 'unstar' });
			return axios.get(`/api/star?gitUser=${this.state.gitUser}&gitRepo=${this.state.gitRepo}`);
		} else {
			this.setState({ starred: 'star' });
			return axios.get(`/api/unstar?gitUser=${this.state.gitUser}&gitRepo=${this.state.gitRepo}`);
		}
	}

  render() {
    return (
      <div className="App">
				<div>
					{
						this.state.user ?
							<div>
								<div className='user-image-container'>
									<img src={this.state.user.picture} alt={this.state.user.name}
										style={{width: '100px'}}/>
								</div>

								<p>{this.state.user.name}</p>

								<input onChange={e => this.changeHandler(e.target.name, e.target.value)}
									name='gitUser' placeholder='Repo Owner' value={this.state.gitUser} />
								<input onChange={e => this.changeHandler(e.target.name, e.target.value)}
									name='gitRepo' placeholder='Repo to Star' value={this.state.gitRepo} />

								<div>
									<button onClick={this.star}>{this.state.starred}</button>
									<button onClick={this.logout}>logout</button>
								</div>
							</div>
						:
							<div>
								<p>{this.state.message}</p>
								<button onClick={this.login}>login</button>
							</div>
					}
				</div>
      </div>
    );
  }
}

export default App;
