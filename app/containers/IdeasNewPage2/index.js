import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from 'styled-components';
import { preprocess } from 'utils';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import { injectTFunc } from 'utils/containers/t/utils';
import WatchSagas from 'containers/WatchSagas';
// import { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
// import { API_PATH } from 'containers/App/constants';
import sagas from './sagas';
import { loadTopics, loadProjects, submitIdea } from './actions';
import { makeSelectTopics, makeSelectProjects, makeSelectIdeaId } from './selectors';
import { makeSelectLocale } from '../LanguageProvider/selectors';
import { makeSelectCurrentUser } from '../../utils/auth/selectors';
import messages from './messages';
import Select from 'components/UI/Select';
import MultipleSelect from 'components/UI/MultipleSelect';
import Label from 'components/UI/Label';
import Input from 'components/UI/Input';
import LocationInput from 'components/UI/LocationInput';
import Editor from 'components/UI/Editor';
import Button from 'components/UI/Button';
import Upload from 'components/UI/Upload';
import { convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import _ from 'lodash';

const PageContainer = styled.div`
  background: #f8f8f8;
  position: relative;
`;

const FormContainerOuter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 30px;
  padding-right: 30px;
  padding-top: 40px;
  padding-bottom: 100px;
`;

const PageTitle = styled.h2`
  color: #444;
  font-size: 36px;
  font-weight: 500;
  margin-bottom: 20px;
`;

const FormContainerInner = styled.div`
  width: 100%;
  max-width: 580px;
`;

const FormElement = styled.div`
  width: 100%;
  margin-bottom: 44px;
`;

const EditorWrapper = styled.div`
  margin-bottom: 44px;
`;

const ButtonBar = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: solid 1px red;
  background: #fff;
  position: sticky;
  bottom: 30px;
`;

const ButtonBarInner = styled.div`
  max-width: 580px;
  padding: 20px;
  background: #fff;
`;

class IdeasNewPage2 extends React.Component {
  constructor() {
    super();

    this.state = {
      title: null,
      titleError: null,
      description: null,
      descriptionError: null,
      topics: null,
      project: null,
      location: null,
      images: null,
    };

    this.dropzone = null;
  }

  componentDidMount() {
    // get form data
    this.props.loadTopics();
    this.props.loadProjects();

    // generate ideaId
    // this.props.submitIdea(null, null, null, null, null, null, 'draft');

    // autofocus the title input field on initial render;
    if (this.titleInput) {
      this.titleInput.focus();
    }
  }

  getOptions(list) {
    const options = [];

    if (list && list.size && list.size > 0) {
      list.forEach((item) => {
        options.push({
          value: item.get('id'),
          label: this.props.tFunc(item.getIn(['attributes', 'title_multiloc']).toJS()),
        });
      });
    }

    return options;
  }

  async getBase64(image) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.readAsDataURL(image);
    });
  }

  handleTitleOnChange = (title) => {
    this.setState({
      title,
      titleError: null,
    });
  }

  handleDescriptionOnChange = (description) => {
    this.setState((state) => ({
      description,
      descriptionError: (description.getCurrentContent().hasText() ? null : state.descriptionError),
    }));
  }

  handleTopicsOnChange = (topics) => {
    this.setState({ topics });
  }

  handleProjectOnChange = (project) => {
    this.setState({ project });
  }

  handleLocationOnChange = (location) => {
    this.setState({ location });
  }

  handleUploadOnAdd = async (image) => {
    const base64 = await this.getBase64(image);

    this.setState((state) => {
      const newImage = { ...image, base64 };
      const images = (state.images ? [...state.images, newImage] : [newImage]);
      return { images };
    });
  };

  handleUploadOnRemove = (removedImage) => {
    this.setState((state) => {
      const images = state.images.filter((image) => image.preview !== removedImage.preview);
      return { images };
    });
  };

  handleSetRef = (element) => {
    this.titleInput = element;
  }

  removeImage = (removedImage) => (event) => {
    event.preventDefault();
    event.stopPropagation();

    this.setState((state) => {
      const images = state.images.filter((image) => image.preview !== removedImage.preview);
      return { images };
    });
  }

  handleOnSubmit = () => {
    let hasErrors = false;
    const { user, locale } = this.props;
    const { formatMessage } = this.props.intl;
    const { title, description, topics, project, location, images } = this.state;

    if (!title) {
      hasErrors = true;
      this.setState({ titleError: formatMessage(messages.titleEmptyError) });
    }

    if (!description || !description.getCurrentContent().hasText()) {
      hasErrors = true;
      this.setState({ descriptionError: formatMessage(messages.descriptionEmptyError) });
    }

    if (!hasErrors) {
      const localTitle = { [locale]: title };
      const localDescription = { [locale]: draftToHtml(convertToRaw(description.getCurrentContent())) };

      console.log(user);
      console.log(localTitle);
      console.log(localDescription);
      console.log(topics);
      console.log(location);
      console.log(project);
      console.log(images);

      // this.props.submitIdea(user.id, localTitle, localDescription, topics, location, project, 'published');
    }

    /*
    geocodeByAddress(this.state.address)
      .then(results => getLatLng(results[0]))
      .then(latLng => console.log('Success', latLng))
      .catch(error => console.error('Error', error))
    */
  }

  render() {
    const { topics, projects } = this.props;
    const { formatMessage } = this.props.intl;
    const { title, titleError, description, descriptionError, topics: selectedTopics, project, location, images } = this.state;
    const uploadedImages = _(images).map((image) => _.omit(image, 'base64')).value();

    return (
      <div>
        <WatchSagas sagas={sagas} />

        <PageContainer>
          <FormContainerOuter>
            <PageTitle>
              <FormattedMessage {...messages.pageTitle} />
            </PageTitle>

            <FormContainerInner>
              <Label value={formatMessage(messages.titleLabel)} htmlFor="title" />
              <FormElement>
                <Input
                  type="text"
                  id="title"
                  value={title}
                  placeholder={formatMessage(messages.titlePlaceholder)}
                  error={titleError}
                  onChange={this.handleTitleOnChange}
                  setRef={this.handleSetRef}
                />
              </FormElement>

              <Label value={formatMessage(messages.descriptionLabel)} />
              <EditorWrapper>
                <Editor
                  value={description}
                  placeholder={formatMessage(messages.descriptionPlaceholder)}
                  error={descriptionError}
                  onChange={this.handleDescriptionOnChange}
                />
              </EditorWrapper>

              <Label value={formatMessage(messages.topicsLabel)} />
              <FormElement>
                <MultipleSelect
                  value={selectedTopics}
                  placeholder={formatMessage(messages.topicsPlaceholder)}
                  options={this.getOptions(topics)}
                  onChange={this.handleTopicsOnChange}
                  max={2}
                />
              </FormElement>

              <Label value={formatMessage(messages.projectsLabel)} />
              <FormElement>
                <Select
                  clearable
                  value={project}
                  placeholder={formatMessage(messages.projectsPlaceholder)}
                  options={this.getOptions(projects)}
                  onChange={this.handleProjectOnChange}
                />
              </FormElement>

              <FormElement>
                <Label value={formatMessage(messages.locationLabel)} />
                <LocationInput
                  value={location}
                  placeholder={formatMessage(messages.locationPlaceholder)}
                  onChange={this.handleLocationOnChange}
                />
              </FormElement>

              <FormElement>
                <Label value={formatMessage(messages.imageUploadLabel)} />
                <Upload
                  multiple
                  items={uploadedImages}
                  accept="image/jpg, image/jpeg, image/png, image/gif"
                  maxSize={5000000}
                  maxItems={5}
                  placeholder={formatMessage(messages.imageUploadPlaceholder)}
                  onAdd={this.handleUploadOnAdd}
                  onRemove={this.handleUploadOnRemove}
                />
              </FormElement>
            </FormContainerInner>
          </FormContainerOuter>

          <ButtonBar>
            <ButtonBarInner>
              <Button
                size="2"
                loading={false}
                text={formatMessage(messages.submit)}
                onClick={this.handleOnSubmit}
              />
            </ButtonBarInner>
          </ButtonBar>
        </PageContainer>
      </div>
    );
  }
}

IdeasNewPage2.propTypes = {
  intl: intlShape.isRequired,
  tFunc: PropTypes.func.isRequired,
  locale: PropTypes.string.isRequired,
  user: PropTypes.object,
  topics: ImmutablePropTypes.list.isRequired,
  projects: ImmutablePropTypes.list.isRequired,
  ideaId: PropTypes.string,
  loadTopics: PropTypes.func.isRequired,
  loadProjects: PropTypes.func.isRequired,
  submitIdea: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  locale: makeSelectLocale(),
  user: makeSelectCurrentUser(),
  topics: makeSelectTopics(),
  projects: makeSelectProjects(),
  ideaId: makeSelectIdeaId(),
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  loadTopics,
  loadProjects,
  submitIdea,
}, dispatch);

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { locale, user, topics, projects, ideaId } = stateProps;
  return {
    locale,
    user,
    topics,
    projects,
    ideaId,
    ...dispatchProps,
    ...ownProps,
  };
};

export default injectTFunc(injectIntl(preprocess(mapStateToProps, mapDispatchToProps, mergeProps)(IdeasNewPage2)));
