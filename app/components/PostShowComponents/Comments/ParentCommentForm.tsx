import React, { PureComponent } from 'react';
import { isString, trim, get } from 'lodash-es';
import { adopt } from 'react-adopt';
import { isNilOrError } from 'utils/helperUtils';

// components
import Button from 'components/UI/Button';
import MentionsTextArea from 'components/UI/MentionsTextArea';
import Author from 'components/Author';

// tracking
import { trackEventByName } from 'utils/analytics';
import tracks from './tracks';

// i18n
import { InjectedIntlProps } from 'react-intl';
import { FormattedMessage, injectIntl } from 'utils/cl-intl';
import messages from './messages';

// services
import { addCommentToIdea, addCommentToInitiative } from 'services/comments';
import { canModerate } from 'services/permissions/rules/projectPermissions';

// resources
import GetLocale, { GetLocaleChildProps } from 'resources/GetLocale';
import GetAuthUser, { GetAuthUserChildProps } from 'resources/GetAuthUser';
import GetPost, { GetPostChildProps } from 'resources/GetPost';

// events
import { commentAdded } from './events';

// style
import styled from 'styled-components';
import { hideVisually } from 'polished';
import { colors, defaultStyles } from 'utils/styleUtils';
import GetInitiativesPermissions, {
  GetInitiativesPermissionsChildProps,
} from 'resources/GetInitiativesPermissions';

const Container = styled.div``;

const CommentContainer = styled.div`
  padding: 10px;
  padding-top: 5px;
  background: #fff;
  border: 1px solid ${colors.border};
  border-radius: ${(props: any) => props.theme.borderRadius};

  &.focused {
    border-color: ${colors.focussedBorder};
    box-shadow: ${defaultStyles.boxShadowFocused};
  }
`;

const AuthorWrapper = styled.div`
  width: 100%;
  margin-bottom: 10px;
`;

const StyledAuthor = styled(Author)`
  margin-left: -4px;
`;

const Form = styled.form`
  width: 100%;
`;

const HiddenLabel = styled.span`
  ${hideVisually()}
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

interface InputProps {
  postId: string;
  postType: 'idea' | 'initiative';
  postingComment: (arg: boolean) => void;
  className?: string;
}

interface DataProps {
  commentingPermissionInitiative: GetInitiativesPermissionsChildProps;
  locale: GetLocaleChildProps;
  authUser: GetAuthUserChildProps;
  post: GetPostChildProps;
}

interface Props extends InputProps, DataProps {}

interface State {
  inputValue: string;
  focused: boolean;
  processing: boolean;
  errorMessage: string | null;
}

class ParentCommentForm extends PureComponent<
  Props & InjectedIntlProps,
  State
> {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: '',
      focused: false,
      processing: false,
      errorMessage: null,
    };
  }

  componentDidUpdate(_prevProps: Props, prevState: State) {
    if (prevState.processing !== this.state.processing) {
      this.props.postingComment(this.state.processing);
    }
  }

  onChange = (inputValue: string) => {
    this.setState({
      inputValue,
      focused: true,
      errorMessage: null,
    });
  };

  onFocus = () => {
    const { postId, postType } = this.props;

    trackEventByName(tracks.focusParentCommentEditor, {
      extra: {
        postId,
        postType,
      },
    });

    this.setState({ focused: true });
  };

  onBlur = () => {
    this.setState({ focused: false });
  };

  onSubmit = async () => {
    const { locale, authUser, postId, postType, post } = this.props;
    const { formatMessage } = this.props.intl;
    const { inputValue } = this.state;
    const projectId: string | null = get(
      post,
      'relationships.project.data.id',
      null
    );

    this.setState({
      focused: false,
      processing: true,
      errorMessage: null,
    });

    if (locale && authUser && isString(inputValue) && trim(inputValue) !== '') {
      const commentBodyMultiloc = {
        [locale]: inputValue.replace(/\@\[(.*?)\]\((.*?)\)/gi, '@$2'),
      };

      trackEventByName(tracks.clickParentCommentPublish, {
        extra: {
          postId,
          postType,
          content: inputValue,
        },
      });

      try {
        this.setState({ processing: true });

        if (postType === 'idea' && projectId) {
          await addCommentToIdea(
            postId,
            projectId,
            authUser.id,
            commentBodyMultiloc
          ).then((comment) => {
            const parentComment = document.getElementById(comment.data.id);
            if (parentComment) {
              setTimeout(() => {
                parentComment.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          });
        }

        if (postType === 'initiative') {
          await addCommentToInitiative(
            postId,
            authUser.id,
            commentBodyMultiloc
          ).then((comment) => {
            const parentComment = document.getElementById(comment.data.id);
            if (parentComment) {
              setTimeout(() => {
                parentComment.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          });
        }

        commentAdded();

        this.setState({ inputValue: '', processing: false });
      } catch (error) {
        const errorMessage = formatMessage(messages.addCommentError);
        this.setState({ errorMessage, processing: false });
        throw error;
      }
    } else if (locale && authUser && (!inputValue || inputValue === '')) {
      const errorMessage = formatMessage(messages.emptyCommentError);
      this.setState({ errorMessage, processing: false });
    }
  };

  render() {
    const {
      authUser,
      post,
      postId,
      postType,
      className,
      intl: { formatMessage },
      commentingPermissionInitiative,
    } = this.props;
    const { inputValue, focused, processing, errorMessage } = this.state;
    const commentingEnabled =
      postType === 'initiative'
        ? commentingPermissionInitiative?.enabled === true
        : get(
            post,
            'attributes.action_descriptor.commenting_idea.enabled',
            true
          );
    const projectId: string | null = get(
      post,
      'relationships.project.data.id',
      null
    );
    const commentButtonDisabled = !inputValue || inputValue === '';
    const isModerator =
      !isNilOrError(authUser) && canModerate(projectId, { data: authUser });
    const canComment = authUser && commentingEnabled;
    const placeholder = formatMessage(
      messages[`${postType}CommentBodyPlaceholder`]
    );
    const hasAuthUserId = !!authUser?.id;

    if (!isNilOrError(authUser) && canComment) {
      return (
        <Container className={className || ''}>
          <AuthorWrapper>
            <StyledAuthor
              authorId={authUser.id}
              isLinkToProfile={hasAuthUserId}
              size="32px"
              showModeration={isModerator}
            />
          </AuthorWrapper>
          <CommentContainer
            className={`ideaCommentForm ${focused ? 'focused' : ''}`}
          >
            <Form>
              <label htmlFor="submit-comment">
                <HiddenLabel>
                  <FormattedMessage {...messages.yourComment} />
                </HiddenLabel>

                <MentionsTextArea
                  id="submit-comment"
                  className="e2e-parent-comment-form"
                  name="comment"
                  placeholder={placeholder}
                  rows={2}
                  postId={postId}
                  postType={postType}
                  value={inputValue}
                  error={errorMessage}
                  onChange={this.onChange}
                  onFocus={this.onFocus}
                  onBlur={this.onBlur}
                  fontWeight="300"
                  padding="10px 0px"
                  borderRadius="none"
                  border="none"
                  boxShadow="none"
                />
                <ButtonWrapper>
                  <Button
                    className="e2e-submit-parentcomment"
                    processing={processing}
                    icon="send"
                    onClick={this.onSubmit}
                    disabled={commentButtonDisabled}
                  >
                    <FormattedMessage {...messages.publishComment} />
                  </Button>
                </ButtonWrapper>
              </label>
            </Form>
          </CommentContainer>
        </Container>
      );
    }

    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  locale: <GetLocale />,
  authUser: <GetAuthUser />,
  post: ({ postId, postType, render }) => (
    <GetPost id={postId} type={postType}>
      {render}
    </GetPost>
  ),
  commentingPermissionInitiative: (
    <GetInitiativesPermissions action="commenting_initiative" />
  ),
});

const ParentCommentFormWithHoCs = injectIntl<Props>(ParentCommentForm);

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {(dataProps) => (
      <ParentCommentFormWithHoCs {...inputProps} {...dataProps} />
    )}
  </Data>
);
