import React, { PureComponent } from 'react';
import { adopt } from 'react-adopt';
import { isEmpty } from 'lodash-es';
import clHistory from 'utils/cl-router/history';

// components
import AuthProviders, { AuthProvider } from 'components/SignUpIn/AuthProviders';
import PasswordSignup from 'components/SignUpIn/SignUp/PasswordSignup';
import VerificationSteps from 'components/Verification/VerificationSteps';
import CustomFields from 'components/SignUpIn/SignUp/CustomFields';
import Error from 'components/UI/Error';
import QuillEditedContent from 'components/UI/QuillEditedContent';
import { StyledHeaderContainer, StyledHeaderTitle, StyledModalContent } from 'components/SignUpIn/styles';

// resources
import GetAuthUser, { GetAuthUserChildProps } from 'resources/GetAuthUser';
import GetTenant, { GetTenantChildProps } from 'resources/GetTenant';
import GetCustomFieldsSchema, { GetCustomFieldsSchemaChildProps } from 'resources/GetCustomFieldsSchema';

// utils
import { isNilOrError, isUndefinedOrError } from 'utils/helperUtils';
import { handleOnSSOClick } from 'services/singleSignOn';

// events
import { signUpActiveStepChange } from 'components/SignUpIn/events';

// i18n
import { injectIntl, FormattedMessage } from 'utils/cl-intl';
import { InjectedIntlProps } from 'react-intl';
import T from 'components/T';
import messages from './messages';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from './tracks';

// style
import styled from 'styled-components';
import { colors } from 'utils/styleUtils';
import { HeaderSubtitle } from 'components/UI/Modal';

// typings
import { ISignUpInMetaData } from 'components/SignUpIn';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const SignUpHelperText = styled(QuillEditedContent)`
  padding-bottom: 25px;
`;

export type TSignUpSteps = 'auth-providers' | 'password-signup' | 'verification' | 'custom-fields';

export interface InputProps {
  metaData: ISignUpInMetaData;
  onSignUpCompleted: () => void;
  onGoToSignIn: () => void;
  className?: string;
}

interface DataProps {
  authUser: GetAuthUserChildProps;
  tenant: GetTenantChildProps;
  customFieldsSchema: GetCustomFieldsSchemaChildProps;
}

interface Props extends InputProps, DataProps {}

interface State {
  activeStep: TSignUpSteps | null | undefined;
  isPasswordSignup: boolean;
  userId: string | null;
  error: boolean;
}

class SignUp extends PureComponent<Props & InjectedIntlProps, State> {
  constructor(props) {
    super(props);
    this.state = {
      activeStep: undefined,
      isPasswordSignup: false,
      userId: null,
      error: false
    };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    const { activeStep, error } = state;
    const { authUser, onSignUpCompleted, metaData } = props;
    let nextActiveStep = activeStep;

    if (activeStep === undefined && !isUndefinedOrError(authUser)) {
      nextActiveStep = null;

      if (authUser === null) { // not logged in
        nextActiveStep = metaData.isInvitation ? 'password-signup' : 'auth-providers';
      } else if (!authUser.attributes.verified && metaData.verification) { // logged in but not verified and verification required
        nextActiveStep = 'verification';
      } else if (!authUser.attributes.registration_completed_at) { // logged in but not yet completed custom fields and custom fields enabled
        nextActiveStep = 'custom-fields';
      } else {
        onSignUpCompleted();
      }
    }

    return {
      activeStep: nextActiveStep,
      error: metaData.error || error
    };
  }

  componentDidMount() {
    signUpActiveStepChange(undefined);
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (this.state.activeStep !== prevState.activeStep) {
      signUpActiveStepChange(this.state.activeStep);
    }
  }

  componentWillUnmount() {
    signUpActiveStepChange(undefined);
  }

  goToNextStep = () => {
    const { activeStep } = this.state;
    const { authUser, metaData } = this.props;
    const hasVerificationStep = metaData?.verification;

    if (activeStep === 'auth-providers') {
      this.setState({
        activeStep: 'password-signup',
        isPasswordSignup: true
      });
    } else if (activeStep === 'password-signup' && !isNilOrError(authUser) && !authUser.attributes.verified && hasVerificationStep) {
      this.setState({ activeStep: 'verification' });
    } else if (!isNilOrError(authUser) && !authUser.attributes.registration_completed_at) {
      this.setState({ activeStep: 'custom-fields' });
    } else {
      this.onSignUpCompleted();
    }
  }

  handleOnAuthProviderSelected = (selectedAuthProvider: AuthProvider) => {
    if (selectedAuthProvider === 'email') {
      this.goToNextStep();
    } else {
      handleOnSSOClick(selectedAuthProvider, this.props.metaData);
    }
  }

  handleGoToSignInFlow = () => {
    this.props.onGoToSignIn();
  }

  handleGoBackToSignUpOptions = () => {
    this.setState({ activeStep: 'auth-providers' });
  }

  handlePasswordSignupCompleted = (userId: string) => {
    this.setState({ userId });
    this.goToNextStep();
  }

  handleVerificationCompleted = () => {
    this.goToNextStep();
  }

  handleCustomFieldsCompleted = () => {
    this.onSignUpCompleted();
  }

  onSignUpCompleted = () => {
    trackEventByName(tracks.successfulSignUp);
    this.props.onSignUpCompleted();
  }

  goToSignIn = () => {
    clHistory.push('/sign-in');
  }

  onVerificationError = () => {
    this.setState({ error: true });
  }

  render() {
    const { activeStep, error, isPasswordSignup } = this.state;
    const { tenant, metaData, customFieldsSchema, className, intl: { formatMessage } } = this.props;
    const helperText = isNilOrError(tenant) ? null : tenant.attributes.settings.core.signup_helper_text;
    const steps: TSignUpSteps[] = [];

    if (isPasswordSignup) {
      const hasVerificationStep = metaData?.verification;
      const hasCustomFields = !isNilOrError(customFieldsSchema) && customFieldsSchema.hasCustomFields;

      steps.push('password-signup');

      if (hasVerificationStep) {
        steps.push('verification');
      }

      if (hasCustomFields) {
        steps.push('custom-fields');
      }
    }

    if (activeStep) {
      const totalStepsCount = steps.length;
      const activeStepNumber = steps.indexOf(activeStep) + 1;
      let stepName: string | null = null;

      if (activeStep === 'password-signup') {
        stepName = formatMessage(messages.createYourAccount);
      } else if (activeStep === 'verification') {
        stepName = formatMessage(messages.verifyYourIdentity);
      } else if (activeStep === 'custom-fields') {
        stepName = formatMessage(messages.completeYourProfile);
      }

      const showSubtitle = !!(!error && totalStepsCount > 1 && activeStepNumber > 0 && stepName);

      let headerTitle = messages.signUp2;

      if (error) {
        headerTitle = messages.somethingWentWrongTitle;
      } else if (activeStep === 'custom-fields' && !showSubtitle) {
        headerTitle = messages.completeYourProfile;
      }

      return (
        <Container className={`e2e-sign-up-container ${className}`}>
          <StyledHeaderContainer inModal={!!metaData.inModal}>
            <StyledHeaderTitle inModal={!!metaData.inModal}>
              <FormattedMessage {...headerTitle} />
            </StyledHeaderTitle>

            {showSubtitle &&
              <HeaderSubtitle>
                <FormattedMessage {...messages.headerSubtitle} values={{ activeStepNumber, totalStepsCount, stepName }} />
              </HeaderSubtitle>
            }
          </StyledHeaderContainer>

          <StyledModalContent inModal={!!metaData.inModal}>
            {error ? (
              <Error
                text={formatMessage(messages.somethingWentWrongText)}
                animate={false}
              />
            ) : (
              <>
                {activeStep === 'auth-providers' && !isEmpty(helperText) &&
                  <SignUpHelperText
                    textColor={colors.text}
                    fontSize="base"
                    fontWeight={300}
                  >
                    <T value={helperText} supportHtml />
                  </SignUpHelperText>
                }

                {activeStep === 'auth-providers' &&
                  <AuthProviders
                    flow={metaData.flow}
                    onAuthProviderSelected={this.handleOnAuthProviderSelected}
                    goToOtherFlow={this.handleGoToSignInFlow}
                  />
                }

                {activeStep === 'password-signup' &&
                  <PasswordSignup
                    metaData={metaData}
                    onCompleted={this.handlePasswordSignupCompleted}
                    onGoToSignIn={this.props.onGoToSignIn}
                    onGoBack={this.handleGoBackToSignUpOptions}
                  />
                }

                {activeStep === 'verification' &&
                  <VerificationSteps
                    context={null}
                    initialActiveStep="method-selection"
                    inModal={!!metaData.inModal}
                    showHeader={false}
                    onComplete={this.handleVerificationCompleted}
                    onError={this.onVerificationError}
                  />
                }

                {activeStep === 'custom-fields' &&
                  <CustomFields onCompleted={this.handleCustomFieldsCompleted} />
                }
              </>
            )}
          </StyledModalContent>
        </Container>
      );
    }

    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  authUser: <GetAuthUser />,
  tenant: <GetTenant />,
  customFieldsSchema: <GetCustomFieldsSchema />
});

const SignUpWithHoC = injectIntl(SignUp);

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <SignUpWithHoC {...inputProps} {...dataProps} />}
  </Data>
);
