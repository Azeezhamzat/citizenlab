import * as React from 'react';
import { has, isString } from 'lodash';
import * as Rx from 'rxjs/Rx';

// router
import { Link, browserHistory } from 'react-router';

// components
import Avatar from 'components/Avatar';
import StatusBadge from 'components/StatusBadge';
import Icon from 'components/UI/Icon';
import Comments from './CommentsContainer';
import Sharing from './Sharing';
import IdeaMeta from './IdeaMeta';
import IdeaMap from './IdeaMap';
import Activities from './Activities';
import MoreActionsMenu, { IAction } from 'components/UI/MoreActionsMenu';
import SpamReportForm from 'containers/SpamReport';
import Modal from 'components/UI/Modal';
import UserName from 'components/UI/UserName';
import VoteWrapper from './VoteWrapper';

// services
import { ideaByIdStream, IIdea } from 'services/ideas';
import { userByIdStream, IUser } from 'services/users';
import { ideaImageStream, IIdeaImage } from 'services/ideaImages';
import { ideaStatusStream } from 'services/ideaStatuses';
import { commentsForIdeaStream, IComments } from 'services/comments';
import { projectByIdStream, IProject } from 'services/projects';
import { authUserStream } from 'services/auth';
import { hasPermission } from 'services/permissions';

// i18n
import T from 'components/T';
import { FormattedRelative } from 'react-intl';
import { FormattedMessage } from 'utils/cl-intl';
import messages from './messages';

// animations
import TransitionGroup from 'react-transition-group/TransitionGroup';
import CSSTransition from 'react-transition-group/CSSTransition';

// style
import styled from 'styled-components';
import { media, color } from 'utils/styleUtils';
import { darken } from 'polished';

const Container = styled.div``;

const IdeaContainer = styled.div`
  width: 100%;
  max-width: 840px;
  display: flex;
  flex-direction: column;
  margin: 0;
  margin-left: auto;
  margin-right: auto;
  padding: 0;
  padding-top: 60px;
  padding-bottom: 60px;
  padding-left: 30px;
  padding-right: 30px;
  position: relative;

  ${media.smallerThanMaxTablet`
    padding-top: 30px;
  `}
`;

const HeaderWrapper = styled.div`
  width: 100%;
  padding-right: 250px;
  display: flex;
  flex-direction: column;

  ${media.smallerThanMaxTablet`
    padding-right: 0px;
  `}
`;

const BelongsToProject = styled.p`
  width: 100%;
  color: ${props => props.theme.colors.label};
  font-weight: 300;
  font-size: 16px;
  line-height: 21px;
  margin-bottom: 15px;
`;

const ProjectLink = styled(Link)`
  color: inherit;
  font-weight: 400;
  font-size: inherit;
  line-height: inherit;
  text-decoration: underline;
  transition: all 100ms ease-out;
  margin-left: 4px;

  &:hover {
    color: ${(props) => darken(0.2, props.theme.colors.label)};
    text-decoration: underline;
  }
`;

const Header = styled.div`
  margin-bottom: 45px;
  display: flex;
  flex-direction: column;

  ${media.smallerThanMaxTablet`
    margin-bottom: 30px;
  `}
`;

const IdeaTitle = styled.h1`
  width: 100%;
  color: #444;
  font-size: 32px;
  font-weight: 500;
  line-height: 38px;
  margin: 0;
  padding: 0;

  ${media.smallerThanMaxTablet`
    font-size: 28px;
    line-height: 34px;
    margin-right: 12px;
  `}
`;

const Content = styled.div`
  width: 100%;
  display: flex;

  ${media.smallerThanMaxTablet`
    flex-direction: column;
  `}
`;

const LeftColumn = styled.div`
  flex-grow: 1;
  margin: 0;
  padding: 0;
  padding-right: 55px;
  min-width: 0;

  ${media.smallerThanMaxTablet`
    padding: 0;
  `}
`;

const IdeaImage = styled.img`
  width: 100%;
  margin: 0 0 2rem;
  padding: 0;
  border-radius: 8px;
  border: 1px solid ${color('separation')};
`;

const AuthorContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
`;

const AuthorAndAdressWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 25px;
`;

const MetaButtons = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 30px;
`;

const LocationLabel = styled.div`
  color: ${(props) => props.theme.colors.label};
  font-size: 15px;
  font-weight: 400;
  margin-right: 6px;

  max-width: 200px;
  font-size: 15px;
  line-height: 19px;
  text-align: left;
  font-weight: 400;
  transition: all 100ms ease-out;
  white-space: nowrap;

  ${media.smallerThanMinTablet`
    display: none;
  `}
`;

const LocationIconWrapper = styled.div`
  width: 30px;
  height: 38px;
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
`;

const LocationIcon = styled(Icon)`
  width: 18px;
  fill: ${(props) => props.theme.colors.label};
`;

const LocationButton = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;

  &:hover {
    ${LocationLabel} {
      color: ${(props) => darken(0.2, props.theme.colors.label)};
    }

    ${LocationIcon} {
      fill: ${(props) => darken(0.2, props.theme.colors.label)};
    }
  }
`;

const MapWrapper = styled.div`
  border-radius: 8px;
  border: 1px solid ${color('separation')};
  height: 265px;
  position: relative;
  overflow: hidden;
  z-index: 9;

  &.map-enter {
    height: 0;
    opacity: 0;

    &.map-enter-active {
      height: 265px;
      opacity: 1;
      transition: all 250ms ease-out;
    }
  }

  &.map-exit {
    height: 265px;
    opacity: 1;

    &.map-exit-active {
      height: 0;
      opacity: 0;
      transition: all 250ms ease-out;
    }
  }
`;

const MapPaddingBottom = styled.div`
  width: 100%;
  height: 30px;
`;

const AddressWrapper = styled.p`
  background: rgba(255, 255, 255, .7);
  border-top: 1px solid #eaeaea;
  bottom: 0;
  left: 0;
  margin: 0;
  padding: .5rem;
  position: absolute;
  right: 0;
  z-index: 100;
`;

const AuthorAvatar = styled(Avatar)`
  width: 31px;
  height: 31px;
  margin-right: 8px;
  margin-top: 0px;
`;

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 calc(100% - 39px);
  min-width: 0;
`;

const AuthorName = styled(Link) `
  color: #333;
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  overflow: hidden;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #333;
    text-decoration: underline;
  }

  ${media.smallerThanMaxTablet`
    font-size: 14px;
    line-height: 18px;
  `}
`;

const TimeAgo = styled.div`
  color: #999;
  font-size: 13px;
  line-height: 17px;
  font-weight: 300;
  margin-top: 2px;

  ${media.smallerThanMaxTablet`
    margin-top: 0px;
  `}
`;

const IdeaBody = styled.div`
  color: #474747;
  font-size: 19px;
  line-height: 30px;
  font-weight: 300;

  p {
    margin-bottom: 30px;

    &:last-child {
      margin-bottom: 0px;
    }
  }

  ul {
    list-style-type: disc;
    list-style-position: outside;
    padding: 0;
    padding-left: 30px;
    margin: 0;
    margin-bottom: 25px;

    li {
      padding: 0;
      padding-top: 2px;
      padding-bottom: 2px;
      margin: 0;
    }
  }

  strong {
    font-weight: 500;
  }
`;

const SeparatorRow = styled.div`
  width: 100%;
  height: 1px;
  margin: 0;
  margin-top: 45px;
  margin-bottom: 25px;

  ${media.smallerThanMaxTablet`
    margin-top: 20px;
    margin-bottom: 20px;
  `}
`;

const RightColumn = styled.div`
  flex: 0 0 140px;
  margin: 0;
  padding: 0;
`;

const RightColumnDesktop = RightColumn.extend`
  position: sticky;
  top: 95px;
  align-self: flex-start;

  ${media.smallerThanMaxTablet`
    display: none;
  `}
`;

const MetaContent = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
`;

const VoteLabel = styled.div`
  color: ${(props) => props.theme.colors.label};
  font-size: 15px;
  font-weight: 400;
  margin-bottom: 12px;
  display: none;

  ${media.smallerThanMaxTablet`
    display: block;
  `}
`;

const StatusContainer = styled.div`
  margin-top: 35px;
`;

const StatusContainerMobile = styled(StatusContainer)`
  margin-top: -20px;
  margin-bottom: 35px;
  transform-origin: top left;
  transform: scale(0.9);

  ${media.biggerThanMaxTablet`
    display: none;
  `}
`;

const StatusTitle = styled.h4`
  color: ${(props) => props.theme.colors.label};
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  margin-bottom: 8px;
  padding: 0;
`;

const SharingWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledSharing: any = styled(Sharing)``;

const StyledSharingMobile = styled(StyledSharing)`
  margin: 0;
  margin-bottom: 25px;
  padding: 0;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top: solid 1px #e0e0e0;
  border-bottom: solid 1px #e0e0e0;

  ${media.biggerThanMaxTablet`
    display: none;
  `}
`;

const MoreActionsMenuWrapper = styled.div`
  margin-top: 40px;
  user-select: none;

  * {
    user-select: none;
  }
`;

type Props = {
  ideaId: string;
};

type State = {
  authUser: IUser | null;
  idea: IIdea | null;
  ideaAuthor: IUser | null;
  ideaImage: IIdeaImage | null;
  ideaComments: IComments | null;
  project: IProject | null;
  loading: boolean;
  showMap: boolean;
  spamModalVisible: boolean;
  moreActions: IAction[];
};

export default class IdeasShow extends React.PureComponent<Props, State> {
  ideaId$: Rx.BehaviorSubject<string>;
  subscriptions: Rx.Subscription[];

  constructor(props: Props) {
    super(props as any);
    this.state = {
      authUser: null,
      idea: null,
      ideaAuthor: null,
      ideaImage: null,
      ideaComments: null,
      project: null,
      loading: true,
      showMap: false,
      spamModalVisible: false,
      moreActions: []
    };
    this.ideaId$ = new Rx.BehaviorSubject(null as any);
    this.subscriptions = [];
  }

  componentDidMount() {
    this.ideaId$.next(this.props.ideaId);

    const ideaId$ = this.ideaId$.filter(ideaId => isString(ideaId)).distinctUntilChanged();
    const authUser$ = authUserStream().observable;

    this.subscriptions = [
      ideaId$
        .do((x) => console.log(x))
        .do(() => this.setState({ loading: true }))
        .switchMap(ideaId => ideaByIdStream(ideaId).observable)
        .switchMap((idea) => {
          const ideaImages = idea.data.relationships.idea_images.data;
          const ideaImageId = (ideaImages.length > 0 ? ideaImages[0].id : null);
          const ideaAuthorId = idea.data.relationships.author.data ? idea.data.relationships.author.data.id : null;
          const ideaStatusId = (idea.data.relationships.idea_status ? idea.data.relationships.idea_status.data.id : null);
          const ideaImage$ = (ideaImageId ? ideaImageStream(idea.data.id, ideaImageId).observable : Rx.Observable.of(null));
          const ideaAuthor$ = ideaAuthorId ? userByIdStream(ideaAuthorId).observable : Rx.Observable.of(null);
          const ideaStatus$ = (ideaStatusId ? ideaStatusStream(ideaStatusId).observable : Rx.Observable.of(null));
          const project$ = (idea.data.relationships.project && idea.data.relationships.project.data ? projectByIdStream(idea.data.relationships.project.data.id).observable : Rx.Observable.of(null));
    
          return Rx.Observable.combineLatest(
            authUser$,
            ideaImage$,
            ideaAuthor$,
            ideaStatus$,
            project$,
          ).map(([authUser, ideaImage, ideaAuthor, _ideaStatus, project]) => ({ authUser, idea, ideaImage, ideaAuthor, project }));
        }).subscribe(({ authUser, idea, ideaImage, ideaAuthor, project }) => {
          this.setState({ authUser, idea, ideaImage, ideaAuthor, project, loading: false });
        }),

      ideaId$
        .switchMap(ideaId => commentsForIdeaStream(ideaId).observable)
        .subscribe((ideaComments) => {
          this.setState({ ideaComments });
        }),

      Rx.Observable.combineLatest(
        ideaId$.switchMap(ideaId => ideaByIdStream(ideaId).observable),
        authUser$.filter(authUser => authUser !== null)
      ).switchMap(([idea, authUser]) => {
        return hasPermission({
          item: idea.data,
          action: 'edit',
          user: (authUser as IUser),
          context: idea.data
        }).map((granted) => ({ authUser, granted }));
      }).subscribe(({ granted }) => {
        this.setState(() => {
          let moreActions: IAction[] = [
            {
              label: <FormattedMessage {...messages.reportAsSpam} />,
              handler: this.openSpamModal
            }
          ];

          if (granted) {
            moreActions = [
              ...moreActions,
              {
                label: <FormattedMessage {...messages.editIdea} />,
                handler: this.editIdea,
              }
            ];
          }

          return { moreActions };
        });
      })
    ];
  }

  componentDidUpdate() {
    this.ideaId$.next(this.props.ideaId);
  }

  componentWillUnmount() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  goToUserProfile = () => {
    const { ideaAuthor } = this.state;

    if (ideaAuthor) {
      browserHistory.push(`/profile/${ideaAuthor.data.attributes.slug}`);
    }
  }

  handleMapToggle = () => {
    this.setState((state: State) => {
      const showMap = !state.showMap;
      return { showMap };
    });
  }

  handleMapWrapperSetRef = (element: HTMLDivElement) => {
    if (element) {
      element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' });
    }
  }

  openSpamModal = () => {
    this.setState({ spamModalVisible: true });
  }

  closeSpamModal = () => {
    this.setState({ spamModalVisible: false });
  }

  editIdea = () => {
    browserHistory.push(`/ideas/edit/${this.props.ideaId}`);
  }

  render() {
    const { idea, ideaImage, ideaAuthor, ideaComments, project, loading, showMap, moreActions } = this.state;

    if (!loading && idea !== null) {
      const authorId = ideaAuthor ? ideaAuthor.data.id : null;
      const createdAt = idea.data.attributes.created_at;
      const titleMultiloc = idea.data.attributes.title_multiloc;
      const bodyMultiloc = idea.data.attributes.body_multiloc;
      const statusId = (idea.data.relationships.idea_status && idea.data.relationships.idea_status.data ? idea.data.relationships.idea_status.data.id : null);
      const ideaImageMedium = (ideaImage && has(ideaImage, 'data.attributes.versions.medium') ? ideaImage.data.attributes.versions.medium : null);
      const ideaImageLarge = (ideaImage && has(ideaImage, 'data.attributes.versions.large') ? ideaImage.data.attributes.versions.large : null);
      const ideaLocation = idea.data.attributes.location_point_geojson || null;
      const ideaAdress = idea.data.attributes.location_description || null;
      const projectTitleMultiloc = (project && project.data ? project.data.attributes.title_multiloc : null);
      const projectId = idea.data.relationships.project.data.id;

      const ideaMetaContent = (
        <MetaContent>
          <VoteLabel>
            <FormattedMessage {...messages.voteOnThisIdea} />
          </VoteLabel>

          <VoteWrapper
            ideaId={idea.data.id}
            votingDescriptor={idea.data.relationships.action_descriptor.data.voting}
            projectId={projectId}
          />

          {statusId &&
            <StatusContainer>
              <StatusTitle><FormattedMessage {...messages.ideaStatus} /></StatusTitle>
              <StatusBadge statusId={statusId} />
            </StatusContainer>
          }

          <MetaButtons>
            {ideaLocation && !showMap &&
              <LocationButton onClick={this.handleMapToggle}>
                <LocationIconWrapper>
                  <LocationIcon name="position" />
                </LocationIconWrapper>
                <LocationLabel><FormattedMessage {...messages.openMap} /></LocationLabel>
              </LocationButton>
            }

            {ideaLocation && showMap &&
              <LocationButton onClick={this.handleMapToggle}>
                <LocationIconWrapper>
                  <LocationIcon name="close" />
                </LocationIconWrapper>
                <LocationLabel><FormattedMessage {...messages.closeMap} /></LocationLabel>
              </LocationButton>
            }

            <SharingWrapper>
              <StyledSharing imageUrl={ideaImageLarge} />
            </SharingWrapper>

            {(moreActions && moreActions.length > 0) &&
              <MoreActionsMenuWrapper>
                <MoreActionsMenu
                  height="5px"
                  actions={moreActions}
                  label={<FormattedMessage {...messages.moreOptions} />}
                />
              </MoreActionsMenuWrapper>
            }
          </MetaButtons>
        </MetaContent>
      );

      return (
        <Container>
          <IdeaMeta ideaId={idea.data.id} />

          <IdeaContainer id="e2e-idea-show">
            <HeaderWrapper>
              {project && projectTitleMultiloc &&
                <BelongsToProject>
                  <FormattedMessage
                    {...messages.postedIn}
                    values={{ projectLink:
                      <ProjectLink to={`/projects/${project.data.attributes.slug}`}>
                        <T value={projectTitleMultiloc} />
                      </ProjectLink>
                    }}
                  />
                </BelongsToProject>
              }

              <Header>
                <IdeaTitle>
                  <T value={titleMultiloc} />
                </IdeaTitle>
              </Header>
            </HeaderWrapper>

            <Content>
              <LeftColumn>
                {statusId &&
                  <StatusContainerMobile>
                    <StatusBadge statusId={statusId} />
                  </StatusContainerMobile>
                }

                {ideaImageLarge ? <IdeaImage src={ideaImageLarge} /> : null}

                <AuthorAndAdressWrapper>
                  <AuthorContainer>
                    <AuthorAvatar userId={authorId} size="small" onClick={authorId ? this.goToUserProfile : () => {}} />
                    <AuthorMeta>
                      <AuthorName to={ideaAuthor ?  `/profile/${ideaAuthor.data.attributes.slug}` :  ''}>
                        <FormattedMessage {...messages.byAuthorName} values={{ authorName: <UserName user={ideaAuthor} /> }} />
                      </AuthorName>
                      {createdAt &&
                        <TimeAgo>
                          <FormattedRelative value={createdAt} />
                          <Activities ideaId={this.props.ideaId} />
                        </TimeAgo>
                      }
                    </AuthorMeta>
                  </AuthorContainer>

                  {/*
                  {ideaLocation && !showMap &&
                    <LocationButton onClick={this.handleMapToggle}>
                      <LocationLabel><FormattedMessage {...messages.openMap} /></LocationLabel>
                      <LocationLabelMobile><FormattedMessage {...messages.Map} /></LocationLabelMobile>
                      <LocationIcon name="position" />
                    </LocationButton>
                  }

                  {ideaLocation && showMap &&
                    <LocationButton onClick={this.handleMapToggle}>
                      <LocationLabel><FormattedMessage {...messages.closeMap} /></LocationLabel>
                      <LocationLabelMobile><FormattedMessage {...messages.Map} /></LocationLabelMobile>
                      <LocationIcon name="close" />
                    </LocationButton>
                  }
                  */}
                </AuthorAndAdressWrapper>

                {ideaLocation &&
                  <TransitionGroup>
                    {showMap &&
                      <CSSTransition
                        classNames="map"
                        timeout={300}
                        exit={true}
                      >
                        <MapWrapper innerRef={this.handleMapWrapperSetRef}>
                          {ideaAdress && <AddressWrapper>{ideaAdress}</AddressWrapper>}
                          <IdeaMap location={ideaLocation} id={idea.data.id} />
                        </MapWrapper>
                      </CSSTransition>
                    }
                  </TransitionGroup>
                }

                {ideaLocation && showMap &&
                  <MapPaddingBottom />
                }

                <IdeaBody className={`${!ideaImageLarge && 'noImage'}`}>
                  <T value={bodyMultiloc} />
                </IdeaBody>

                <SeparatorRow />

                <StyledSharingMobile imageUrl={ideaImageMedium} />

                {ideaComments && <Comments ideaId={idea.data.id} />}
              </LeftColumn>

              <RightColumnDesktop>
                {ideaMetaContent}
              </RightColumnDesktop>
            </Content>
          </IdeaContainer>
          <Modal opened={this.state.spamModalVisible} close={this.closeSpamModal}>
            <SpamReportForm resourceId={this.props.ideaId} resourceType="ideas" />
          </Modal>
        </Container>
      );
    }

    return null;
  }
}
