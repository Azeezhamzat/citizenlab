import { defineMessages } from 'react-intl';

export default defineMessages({
  pageTitle: {
    id: 'app.containers.Admin.Moderation.pageTitle',
    defaultMessage: 'Moderation',
  },
  type: {
    id: 'app.containers.Admin.Moderation.type',
    defaultMessage: 'Type',
  },
  belongsTo: {
    id: 'app.containers.Admin.Moderation.belongsTo',
    defaultMessage: 'Belongs to',
  },
  project: {
    id: 'app.containers.Admin.Moderation.project',
    defaultMessage: 'Project',
  },
  post: {
    id: 'app.containers.Admin.Moderation.post',
    defaultMessage: 'Post',
  },
  initiative: {
    id: 'app.containers.Admin.Moderation.initiative',
    defaultMessage: 'Initiative',
  },
  comment: {
    id: 'app.containers.Admin.Moderation.comment',
    defaultMessage: 'Comment',
  },
  content: {
    id: 'app.containers.Admin.Moderation.content',
    defaultMessage: 'Content',
  },
  date: {
    id: 'app.containers.Admin.Moderation.date',
    defaultMessage: 'Date',
  },
  rowsPerPage: {
    id: 'app.containers.Admin.Moderation.rowsPerPage',
    defaultMessage: 'Rows per page',
  },
  show: {
    id: 'app.containers.Admin.Moderation.show',
    defaultMessage: 'Show',
  },
  status: {
    id: 'app.containers.Admin.Moderation.status',
    defaultMessage: 'Status',
  },
  all: {
    id: 'app.containers.Admin.Moderation.all',
    defaultMessage: 'All',
  },
  read: {
    id: 'app.containers.Admin.Moderation.read',
    defaultMessage: 'Viewed',
  },
  unread: {
    id: 'app.containers.Admin.Moderation.unread',
    defaultMessage: 'Not viewed',
  },
  noViewedItems: {
    id: 'app.containers.Admin.Moderation.noViewedItems',
    defaultMessage: 'There are no viewed items',
  },
  noUnviewedItems: {
    id: 'app.containers.Admin.Moderation.noUnviewedItems',
    defaultMessage: 'There are no unviewed items',
  },
  noWarningItems: {
    id: 'app.containers.Admin.Moderation.noWarningItems',
    defaultMessage: 'There are no items with content warning',
  },
  readMore: {
    id: 'app.containers.Admin.Moderation.readMore',
    defaultMessage: '...see more',
  },
  collapse: {
    id: 'app.containers.Admin.Moderation.collapse',
    defaultMessage: 'see less',
  },
  markSeen: {
    id: 'app.containers.Admin.Moderation.markSeen',
    defaultMessage:
      'Mark {selectedItemsCount, plural, one {# item} other {# items}} as seen',
  },
  markNotSeen: {
    id: 'app.containers.Admin.Moderation.markNotSeen',
    defaultMessage:
      'Mark {selectedItemsCount, plural, one {# item} other {# items}} as not seen',
  },
  goToThisContentType: {
    id: 'app.containers.Admin.Moderation.goToThisContentType',
    defaultMessage: 'Open this {contentType} in a new tab',
  },
  moderationsTooltip: {
    id: 'app.containers.Admin.Moderation.moderationsTooltip',
    defaultMessage:
      "This page allows you to quickly check all new input that has been added to your platform, including posts and comments. You can mark posts as being 'seen' so that others know which inputs still need to be processed.",
  },
  settings: {
    id: 'app.containers.Admin.Moderation.settings',
    defaultMessage: 'Settings',
  },
  profanityBlockerSetting: {
    id: 'app.containers.Admin.Moderation.profanityBlockerSetting',
    defaultMessage: 'Profanity blocker',
  },
  profanityBlockerSettingDescription: {
    id: 'app.containers.Admin.Moderation.profanityBlockerSettingDescription',
    defaultMessage:
      'Block posts containing the most commonly reported offensive words.',
  },
  successfulUpdateSettings: {
    id: 'app.containers.Admin.Moderation.successfulUpdateSettings',
    defaultMessage: 'Settings updated successfully.',
  },
  settingsSavingError: {
    id: 'app.containers.Admin.Moderation.settingsSavingError',
    defaultMessage: "Couldn't save. Try changing the setting again.",
  },
  removeFlagsError: {
    id: 'app.containers.Admin.Moderation.removeFlagsError',
    defaultMessage: "Couldn't remove warning(s). Try again.",
  },
  markFlagsError: {
    id: 'app.containers.Admin.Moderation.markFlagsError',
    defaultMessage: "Couldn't mark item(s). Try again.",
  },
});
