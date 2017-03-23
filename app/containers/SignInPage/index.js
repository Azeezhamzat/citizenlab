/*
 *
 * SignInPage
 *
 */

import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import {
  Button,
} from 'components/Foundation';
import makeSelectSignInPage from './selectors';
import messages from './messages';
import Form from './Form';
import { userLogin } from './actions';
import socialAuth from '../../socialAuth';

const Box = styled.div`
  padding: 20px;
  border: 1px solid #888;
  margin-bottom: 20px;
`;

export const LoggedInAsBox = () => (
  <Box>
    { socialAuth('facebook').isLoggedIn() ? 'logged in? yes' : 'logged in? no' }
  </Box>
);

export const SocialLoginBox = (props) => {
  const handleLoginClick = () => {
    socialAuth('facebook').login().then(props.onChange);
  };

  const handleLogoutClick = () => {
    socialAuth('facebook').logout();
    props.onChange();
  };

  return (
    <Box>
      <h4>Social Login</h4>

      {socialAuth('facebook').isLoggedIn() ?
        <Button onClick={() => handleLogoutClick()}>Logout</Button> :
        <Button className="clLoginBtn" onClick={() => handleLoginClick()}>Facebook</Button>}
    </Box>
  );
};

export class SignInPage extends React.PureComponent { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div>
        <Helmet
          title="SignInPage"
          meta={[
            { name: 'description', content: 'Description of SignInPage' },
          ]}
        />

        <h1>
          <FormattedMessage {...messages.header} />
        </h1>

        <LoggedInAsBox />

        <SocialLoginBox onChange={() => this.forceUpdate()} />

        <Box>
          <Form onSubmit={this.props.onSubmit} />
        </Box>
      </div>
    );
  }
}

SignInPage.propTypes = {
  onSubmit: React.PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  SignInPage: makeSelectSignInPage(),
});

function mapDispatchToProps(dispatch) {
  return {
    onSubmit: (values) => dispatch(userLogin(values)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SignInPage);
