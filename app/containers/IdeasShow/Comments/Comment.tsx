// libraries
import React, { PureComponent } from 'react';
import { adopt } from 'react-adopt';
import { isNilOrError } from 'utils/helperUtils';
import { get } from 'lodash-es';
import clHistory from 'utils/cl-router/history';

// components
import CommentHeader from './CommentHeader';
import CommentBody from './CommentBody';
import CommentFooter from './CommentFooter';
import Avatar from 'components/Avatar';
import Icon from 'components/UI/Icon';

// services
import { updateComment, IUpdatedComment } from 'services/comments';
import { canModerate } from 'services/permissions/rules/projectPermissions';

// resources
import GetComment, { GetCommentChildProps } from 'resources/GetComment';
import GetIdea, { GetIdeaChildProps } from 'resources/GetIdea';
import GetUser, { GetUserChildProps } from 'resources/GetUser';

// analytics
import { trackEventByName } from 'utils/analytics';
import tracks from './tracks';

// i18n
import { FormattedMessage } from 'utils/cl-intl';
import messages from '../messages';

// style
import styled from 'styled-components';
import { media, colors, fontSizes } from 'utils/styleUtils';

// typings
import { FormikActions } from 'formik';
import { CLErrorsJSON } from 'typings';

const Container = styled.div`
  &.child {
    background: #fbfbfb;
  }
`;

const ContainerInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding-top: 28px;
  padding-bottom: 25px;
  border-bottom: solid 1px #e8e8e8;

  &.lastComment {
    border-bottom: none;
    padding-bottom: 40px;
  }

  &.parent {
    padding-left: 50px;
    padding-right: 50px;
  }

  &.child {
    margin-left: 100px;
    margin-right: 50px;
  }

  ${media.smallerThanMinTablet`
    &.parent {
      padding-left: 20px;
      padding-right: 20px;
    }

    &.child {
      margin-left: 40px;
      margin-right: 20px;
    }
  `}

  ${media.phone`
    &.parent {
      padding-left: 15px;
      padding-right: 15px;
    }

    &.child {
      margin-left: 15px;
      margin-right: 15px;
    }
  `}
`;

const CommmentHeaderWrapper = styled.div`
  ${media.biggerThanMinTablet`
    &.child {
      display: none;
    }
  `}
`;

const Content = styled.div`
  display: flex;
`;

const AvatarWrapper = styled.div`
  margin-right: 7px;

  ${media.smallerThanMinTablet`
    display: none;
  `}
`;

const BodyAndFooter = styled.div`
  flex: 1;
`;

const DeletedComment = styled.div`
  color: ${colors.label};
  display: flex;
  align-items: center;
  font-size: ${fontSizes.small}px;
  font-weight: 400;
  font-style: italic;
`;

const DeletedIcon = styled(Icon)`
  width: 18px;
  height: 18px;
  margin-right: 12px;
  fill: ${colors.label};
`;

interface InputProps {
  commentId: string;
  commentType: 'parent' | 'child';
  hasChildComments?: boolean;
  last?: boolean;
  className?: string;
}

interface DataProps {
  comment: GetCommentChildProps;
  idea: GetIdeaChildProps;
  author: GetUserChildProps;
}

interface Props extends InputProps, DataProps {}

interface State {
  spamModalVisible: boolean;
  editing: boolean;
  translateButtonClicked: boolean;
}

class Comment extends PureComponent<Props, State> {
  static defaultProps = {
    hasChildComment: false,
    last: false
  };

  constructor(props) {
    super(props);
    this.state = {
      spamModalVisible: false,
      editing: false,
      translateButtonClicked: false,
    };
  }

  onEditing = () => {
    this.setState({ editing: true });
  }

  onCancelEditing = () => {
    this.setState({ editing: false });
  }

  onCommentSave = async (comment: IUpdatedComment, formikActions: FormikActions<IUpdatedComment>) => {
    const { setSubmitting, setErrors } = formikActions;

    try {
      await updateComment(this.props.commentId, comment);
      this.setState({ editing: false });
    } catch (error) {
      if (error && error.json) {
        const apiErrors = (error as CLErrorsJSON).json.errors;
        setErrors(apiErrors);
        setSubmitting(false);
      }
    }
  }

  translateComment = () => {
    const { translateButtonClicked } = this.state;

    // tracking
    if (translateButtonClicked) {
      trackEventByName(tracks.clickGoBackToOriginalCommentButton);
    } else {
      trackEventByName(tracks.clickTranslateCommentButton);
    }

    this.setState(({ translateButtonClicked }) => ({ translateButtonClicked: !translateButtonClicked }));
  }

  goToUserProfile = () => {
    const { author } = this.props;

    if (!isNilOrError(author)) {
      clHistory.push(`/profile/${author.attributes.slug}`);
    }
  }

  render() {
    const { comment, idea, author, commentType, hasChildComments, last, className } = this.props;
    const { translateButtonClicked, editing } = this.state;

    if (!isNilOrError(comment) && !isNilOrError(idea)) {
      const commentId = comment.id;
      const ideaId = idea.id;
      const lastComment = ((commentType === 'parent' && !hasChildComments) || (commentType === 'child' && last === true));
      const projectId = idea.relationships.project.data.id;
      const authorCanModerate = !isNilOrError(author) && canModerate(projectId, { data: author });

      return (
        <Container className={`${className} ${commentType} e2e-comment`}>
          <ContainerInner className={`${commentType} ${lastComment ? 'lastComment' : ''}`}>
            {comment.attributes.publication_status === 'published' &&
              <>
                <CommmentHeaderWrapper className={commentType}>
                  <CommentHeader
                    commentId={commentId}
                    commentType={commentType}
                  />
                </CommmentHeaderWrapper>

                <Content>
                  {commentType === 'child' &&
                    <AvatarWrapper>
                      <Avatar
                        userId={!isNilOrError(author) ? author.id : null}
                        size="32px"
                        moderator={authorCanModerate}
                        onClick={this.goToUserProfile}
                        badgeBgColor={commentType === 'child' ? '#fbfbfb' : '#fff'}
                      />
                    </AvatarWrapper>
                  }

                  <BodyAndFooter>
                    <CommentBody
                      commentId={commentId}
                      commentType={commentType}
                      commentBody={comment.attributes.body_multiloc}
                      editing={editing}
                      onCommentSave={this.onCommentSave}
                      onCancelEditing={this.onCancelEditing}
                      translateButtonClicked={translateButtonClicked}
                    />
                    <CommentFooter
                      className={commentType}
                      ideaId={ideaId}
                      commentId={commentId}
                      commentType={commentType}
                      onEditing={this.onEditing}
                    />
                  </BodyAndFooter>
                </Content>
              </>
            }

            {comment.attributes.publication_status === 'deleted' &&
              <DeletedComment>
                <DeletedIcon name="delete" />
                <FormattedMessage {...messages.commentDeletedPlaceholder} />
              </DeletedComment>
            }
          </ContainerInner>
        </Container>
      );
    }

    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  comment: ({ commentId, render }) => <GetComment id={commentId}>{render}</GetComment>,
  idea: ({ comment, render }) => <GetIdea id={get(comment, 'relationships.idea.data.id')}>{render}</GetIdea>,
  author: ({ comment, render }) => <GetUser id={get(comment, 'relationships.author.data.id')}>{render}</GetUser>
});

export default (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <Comment {...inputProps} {...dataProps} />}
  </Data>
);
