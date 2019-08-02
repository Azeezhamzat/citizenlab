import React, { PureComponent } from 'react';
import { isNilOrError } from 'utils/helperUtils';
import { adopt } from 'react-adopt';
import { get } from 'lodash-es';

// components
import Title from 'components/PostComponents/Title';
import Body from 'components/PostComponents/Body';
import LoadableDropdownMap from 'components/PostComponents/DropdownMap/LoadableDropdownMap';
import OfficialFeedback from 'components/PostComponents/OfficialFeedback';
import PostedBy from 'containers/InitiativesShow/PostedBy';
// import Comments from 'containers/IdeasShow/Comments';
import FileAttachments from 'components/UI/FileAttachments';
import PostSettings from './PostSettings';
import Button from 'components/UI/Button';
import { Top, Content, Container } from '.';

// srvices
import { deleteInitiative } from 'services/initiatives';

// resources
import GetResourceFiles, { GetResourceFilesChildProps } from 'resources/GetResourceFiles';
import GetInitiative, { GetInitiativeChildProps } from 'resources/GetInitiative';
import GetInitiativeImages, { GetInitiativeImagesChildProps } from 'resources/GetInitiativeImages';

// i18n
import injectLocalize, { InjectedLocalized } from 'utils/localize';
import { injectIntl, FormattedMessage } from 'utils/cl-intl';
import { InjectedIntlProps } from 'react-intl';
import messages from './messages';

// style
import styled from 'styled-components';
import { colors, fontSizes } from 'utils/styleUtils';

const StyledTitle = styled(Title)`
  margin-bottom: 30px;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Left = styled.div`
  flex: 5;
  margin-right: 50px;
  height: 100%;
`;

const Image = styled.img`
  width: 100%;
  margin: 0 0 2rem;
  padding: 0;
  border-radius: 8px;
  border: 1px solid ${colors.separation};
`;

const StyledBody = styled(Body)`
  margin-bottom: 20px;
`;

const StyledMap = styled(LoadableDropdownMap)`
  margin-bottom: 40px;
`;

const StyledOfficialFeedback = styled(OfficialFeedback)`
  margin-top: 70px;
`;

// const StyledComments = styled(Comments)`
//   margin-top: 30px;
// `;

const Right = styled.div`
  flex: 2;
  position: sticky;
  top: 80px;
  align-self: flex-start;
  color: ${colors.adminTextColor};
  font-size: ${fontSizes.base}px;
  line-height: 19px;
`;

interface State {}

interface InputProps {
  initiativeId: string | null;
  closePreview: () => void;
  handleClickEdit: () => void;
}

interface DataProps {
  initiative: GetInitiativeChildProps;
  initiativeImages: GetInitiativeImagesChildProps;
  initiativeFiles: GetResourceFilesChildProps;
}

interface Props extends InputProps, DataProps {}

export class IdeaContent extends PureComponent<Props & InjectedLocalized & InjectedIntlProps, State> {
  handleClickDelete = () => {
    const { initiative, closePreview } = this.props;
    const message = this.props.intl.formatMessage(messages.deleteIdeaConfirmation);

    if (!isNilOrError(initiative)) {
      if (window.confirm(message)) {
        deleteInitiative(initiative.id);
        closePreview();
      }
    }
  }

  render() {
    const {
      initiative,
      localize,
      initiativeImages,
      initiativeFiles,
      handleClickEdit,
      intl: { formatMessage }
    } = this.props;

    if (!isNilOrError(initiative)) {
      const initiativeId = initiative.id;
      const initiativeTitle = localize(initiative.attributes.title_multiloc);
      const initiativeImageLarge = !isNilOrError(initiativeImages) && initiativeImages.length > 0 ? get(initiativeImages[0], 'attributes.versions.large', null) : null;
      const initiativeGeoPosition = (initiative.attributes.location_point_geojson || null);
      const initiativeAddress = (initiative.attributes.location_description || null);

      return (
        <Container>
          <Top>
            <Button
              icon="edit"
              style="text"
              textColor={colors.adminTextColor}
              onClick={handleClickEdit}
            >
              <FormattedMessage {...messages.edit}/>
            </Button>
            <Button
              icon="delete"
              style="text"
              textColor={colors.adminTextColor}
              onClick={this.handleClickDelete}
            >
              <FormattedMessage {...messages.delete}/>
            </Button>
          </Top>
          <Content>
            <StyledTitle
              id={initiativeId}
              title={initiativeTitle}
              postType="initiative"
            />
            <Row>
              <Left>
                {initiativeImageLarge &&
                  <Image src={initiativeImageLarge} alt={formatMessage(messages.imageAltText, { postTitle: initiativeTitle })} className="e2e-ideaImage"/>
                }

                <PostedBy
                  authorId={get(initiative, 'relationships.author.data.id', null)}
                  showAboutInitiatives={false}
                />

                <StyledBody
                  id={initiativeId}
                  postType="initiative"
                  body={localize(initiative.attributes.body_multiloc)}
                />

                {initiativeGeoPosition && initiativeAddress &&
                  <StyledMap
                    address={initiativeAddress}
                    position={initiativeGeoPosition}
                    id={initiativeId}
                  />
                }

                {initiativeFiles && !isNilOrError(initiativeFiles) &&
                  <FileAttachments files={initiativeFiles} />
                }

                <StyledOfficialFeedback
                  postId={initiativeId}
                  postType="initiative"
                  // If the user has access to the post preview,
                  // it means they are in the admin and therefore have permission
                  permissionToPost
                />

                {/* <StyledComments ideaId={idea.id} /> */}
              </Left>
              <Right>
                <PostSettings
                  postId={initiative.id}
                  postType="initiative"
                />
              </Right>
            </Row>
          </Content>
        </Container>
      );
    }
    return null;
  }
}

const Data = adopt<DataProps, InputProps>({
  initiative: ({ initiativeId, render }) => <GetInitiative id={initiativeId}>{render}</GetInitiative>,
  initiativeFiles: ({ initiativeId, render }) => <GetResourceFiles resourceId={initiativeId} resourceType="initiative">{render}</GetResourceFiles>,
  initiativeImages: ({ initiativeId, render }) => <GetInitiativeImages initiativeId={initiativeId}>{render}</GetInitiativeImages>,
});

const IdeaContentWithHOCs = injectIntl(injectLocalize(IdeaContent));

const WrappedIdeaContent = (inputProps: InputProps) => (
  <Data {...inputProps}>
    {dataProps => <IdeaContentWithHOCs {...inputProps} {...dataProps} />}
  </Data>
);

export default WrappedIdeaContent;
