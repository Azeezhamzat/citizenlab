import React from 'react';
import { isNilOrError } from 'utils/helperUtils';

// hooks
import useAuthUser from 'hooks/useAuthUser';

// components
import FeatureFlag from 'components/FeatureFlag';
import { FormSection } from 'components/UI/FormComponents';
import Button from 'components/UI/Button';
import Avatar from 'components/Avatar';
import Author from 'components/Author';

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// styling
import styled from 'styled-components';
import { fontSizes } from 'utils/styleUtils';

const StyledFormSection = styled(FormSection)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 40px;
`;

const LeftContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const StyledTitle = styled.h2`
  margin: 0;
`;
const TitleStyles = styled.div`
  font-size: ${fontSizes.large}px;
  font-weight: 700;
  line-height: normal;
`;
const TextStyles = styled.div`
  font-size: ${fontSizes.large}px;
  font-weight: 400;
  line-height: normal;
`;

const StyledAvatar = styled(Avatar)`
  margin-right: 25px;
`;

const VerificationStatus = () => {
  const authUser = useAuthUser();
  if (isNilOrError(authUser)) return null;

  return (
    <FeatureFlag name="verification">
      <StyledFormSection>
        {authUser.data.attributes.is_verified ?
          <LeftContainer>
            <StyledAvatar
              userId={authUser.data.id}
              size="55px"
              verified
            />
            <StyledTitle>
              <TitleStyles>
                <FormattedMessage {...messages.verifiedTitle} />
              </TitleStyles>
              <TextStyles>
                <FormattedMessage {...messages.verifiedText} />
              </TextStyles>
            </StyledTitle>
          </LeftContainer>
          :
          <>
            <LeftContainer>
              <StyledAvatar
                userId={authUser.data.id}
                size="55px"
              />
              <StyledTitle>
                <TitleStyles>
                  <FormattedMessage {...messages.verifyTitle} />
                </TitleStyles>
                <TextStyles>
                  <FormattedMessage {...messages.verifyText} />
                </TextStyles>
              </StyledTitle>
            </LeftContainer>
            <Button
              onClick={() => console.log('TODO Open verification Modal')}
            >
              <FormattedMessage {...messages.verifyNow} />
            </Button>
          </>
        }
      </StyledFormSection>
    </FeatureFlag>
  );
};

export default VerificationStatus;
