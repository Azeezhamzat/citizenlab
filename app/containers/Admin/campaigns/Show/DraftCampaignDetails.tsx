import * as React from 'react';
import { sendCampaign, sendCampaignPreview, ICampaignData, deleteCampaign } from 'services/campaigns';
import clHistory from 'utils/cl-router/history';

import PageWrapper from 'components/admin/PageWrapper';

import { FormattedMessage, injectIntl } from 'utils/cl-intl';
import messages from '../messages';
import GetCampaign from 'resources/GetCampaign';
import { isNilOrError } from 'utils/helperUtils';
import Button from 'components/UI/Button';
import streams from 'utils/streams';
import { API_PATH } from 'containers/App/constants';
import { InjectedIntlProps } from 'react-intl';
import PreviewFrame from './PreviewFrame';
import styled from 'styled-components';

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px 0;
  & > * {
    padding: 0 10px;
  }
`;

interface InputProps {
  campaignId: string;
}

interface DataProps {
  campaign: ICampaignData;
}

interface Props extends InputProps, DataProps, InjectedIntlProps { }

class DraftCampaignDetails extends React.Component<Props> {

  handleSendNow = () => {
    sendCampaign(this.props.campaign.id)
      .then(() => {
        streams.fetchAllStreamsWithEndpoint(`${API_PATH}/campaigns`);
        streams.fetchAllStreamsWithEndpoint(`${API_PATH}/campaigns/${this.props.campaign.id}`);
      })
      .catch(() => {
      });
  }

  handleSendPreview = () => {
    sendCampaignPreview(this.props.campaign.id)
      .then(() => {
        const previewSentConfirmation = this.props.intl.formatMessage(messages.previewSentConfirmation);
        window.alert(previewSentConfirmation);
      });
  }

  handleSaveDraft = () => {
    clHistory.push('/admin/campaigns');
  }

  handleDelete = () => {
    const deleteMessage = this.props.intl.formatMessage(messages.campaignDeletionConfirmation);
    if (window.confirm(deleteMessage)) {
      deleteCampaign(this.props.campaign.id)
        .then(() => {
          clHistory.push('/admin/campaigns');
        });
    }
  }

  render() {
    const { campaign } = this.props;
    return (
      <PageWrapper>
        <div>
          <Button linkTo={`/admin/campaigns/${campaign.id}/edit`} style="secondary" circularCorners={false} icon="edit">
            <FormattedMessage {...messages.editButtonLabel} />
          </Button>
          <PreviewFrame campaignId={campaign.id} />
        </div>

        <Buttons>

          <div>
            <Button
              onClick={this.handleDelete}
              style="text"
              circularCorners={false}
              icon="delete"
            >
              <FormattedMessage {...messages.deleteButtonLabel} />
            </Button>
          </div>

          <div>
            <Button
              style="primary-outlined"
              onClick={this.handleSendPreview}
              circularCorners={false}
            >
              <FormattedMessage {...messages.sendPreviewButton} />
            </Button>
          </div>

          <div>
            <Button
              style="primary"
              circularCorners={false}
              icon="send"
              onClick={this.handleSendNow}
            >
              <FormattedMessage {...messages.sendNowButton} />
            </Button>
          </div>
        </Buttons>

      </PageWrapper>
    );
  }
}

const DraftCampaignDetailsWithHOCs = injectIntl<InputProps & DataProps>(DraftCampaignDetails);

export default (inputProps: InputProps) => (
  <GetCampaign id={inputProps.campaignId}>
    {campaign => isNilOrError(campaign) ? null : <DraftCampaignDetailsWithHOCs {...inputProps} campaign={campaign} />}
  </GetCampaign>
);
