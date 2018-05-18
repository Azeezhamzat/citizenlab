import { defineMessages } from 'react-intl';

export default defineMessages({
  helmetTitle: {
    id: 'app.containers.Admin.User.helmetTitle',
    defaultMessage: 'Admin - users dashboard',
  },
  helmetDescription: {
    id: 'app.containers.Admin.User.helmetDescription',
    defaultMessage: 'User list in admin backoffice',
  },
  viewPublicResource: {
    id: 'app.containers.Admin.User.viewPublicResource',
    defaultMessage: 'Users',
  },
  tabRegisteredUsers: {
    id: 'app.containers.AdminPage.User.tabRegisteredUsers',
    defaultMessage: 'Registered users',
  },
  tabInviteByEmail: {
    id: 'app.containers.AdminPage.User.tabInviteByEmail',
    defaultMessage: 'Invitations',
  },
  exportUsers: {
    id: 'app.containers.Admin.User.exportUsers',
    defaultMessage: 'Export all users',
  },
  deleteButton: {
    id: 'app.containers.Admin.User.deleteButton',
    defaultMessage: 'Delete',
  },
  updateButton: {
    id: 'app.containers.Admin.User.updateButton',
    defaultMessage: 'Edit',
  },
  createButton: {
    id: 'app.containers.Admin.User.createButton',
    defaultMessage: 'New User',
  },
  publishButton: {
    id: 'app.containers.Admin.User.publishButton',
    defaultMessage: 'Publish User',
  },
  userLoadingMessage: {
    id: 'app.containers.Admin.User.userLoadingMessage',
    defaultMessage: 'Loading User...',
  },
  userLoadingError: {
    id: 'app.containers.Admin.User.userLoadingError',
    defaultMessage: 'User not found!',
  },
  name: {
    id: 'app.containers.Admin.User.name',
    defaultMessage: 'Name',
  },
  email: {
    id: 'app.containers.Admin.User.email',
    defaultMessage: 'Email',
  },
  since: {
    id: 'app.containers.Admin.User.since',
    defaultMessage: 'Since',
  },
  member: {
    id: 'app.containers.Admin.User.member',
    defaultMessage: 'Member Since',
  },
  admin: {
    id: 'app.containers.Admin.User.admin',
    defaultMessage: 'Admin',
  },
  delete: {
    id: 'app.containers.Admin.User.delete',
    defaultMessage: 'Delete',
  },
  deleteUser: {
    id: 'app.containers.Admin.User.deleteUser',
    defaultMessage: 'Delete user',
  },
  invitePeople: {
    id: 'app.containers.Admin.User.invitePeople',
    defaultMessage: 'Invite people via email',
  },
  importTab: {
    id: 'app.containers.Admin.User.importTab',
    defaultMessage: 'Import email addresses',
  },
  textTab: {
    id: 'app.containers.Admin.User.textTab',
    defaultMessage: 'Manually enter email addresses',
  },
  emailListLabel: {
    id: 'app.containers.Admin.User.emailListLabel',
    defaultMessage: 'Manually enter the email addresses of the people you want to invite. Seperate each address by a comma.',
  },
  importLabel: {
    id: 'app.containers.Admin.User.importLabel',
    defaultMessage: 'Select an Excel file (.xlsx)',
  },
  importInfo: {
    id: 'app.containers.Admin.User.importInfo',
    defaultMessage: `
      Note: The column in your Excel file that contains the email addresses should be named {emailColumnName}.
      Download this {downloadLink} and visit this {supportPageLink} for more information about all the supported columns.
    `,
  },
  emailColumnName: {
    id: 'app.containers.Admin.User.emailColumnName',
    defaultMessage: `email`,
  },
  exampleFile: {
    id: 'app.containers.Admin.User.exampleFile',
    defaultMessage: `example file`,
  },
  supportPage: {
    id: 'app.containers.Admin.User.supportPage',
    defaultMessage: `support page`,
  },
  importOptionsInfo: {
    id: 'app.containers.Admin.User.importOptionsInfo',
    defaultMessage: `
      These options will only be taken into account when they are not defined in the Excel file.
      Please visit the {supportPageLink} for more information.
    `,
  },
  adminLabel: {
    id: 'app.containers.Admin.User.adminLabel',
    defaultMessage: `Grant administrator rights to the invited people?`,
  },
  localeLabel: {
    id: 'app.containers.Admin.User.localeLabel',
    defaultMessage: 'Select the default language for the invited people',
  },
  invitationOptions: {
    id: 'app.containers.Admin.User.invitationOptions',
    defaultMessage: 'Invitation options',
  },
  groupsLabel: {
    id: 'app.containers.Admin.User.groupsLabel',
    defaultMessage: 'Optionally select one or more groups that will be assigned to the invited people upon registration',
  },
  inviteTextLabel: {
    id: 'app.containers.Admin.User.inviteTextLabel',
    defaultMessage: 'Optionally type a message that will be added to the invitation mail.',
  },
  groupsPlaceholder: {
    id: 'app.containers.Admin.User.groupsPlaceholder',
    defaultMessage: 'No group selected',
  },
  processing: {
    id: 'app.containers.Admin.User.processing',
    defaultMessage: 'Sending out invitations. Please wait...',
  },
  save: {
    id: 'app.containers.Admin.User.save',
    defaultMessage: 'Send out invitations',
  },
  saveSuccess: {
    id: 'app.containers.Admin.User.saveSuccess',
    defaultMessage: 'Success!',
  },
  saveErrorMessage: {
    id: 'app.containers.Admin.User.saveErrorMessage',
    defaultMessage: `
      One or more errors occured.
      Therefore no invitations were sent out.
      Please correct the error(s) listed below and try again.
    `,
  },
  saveSuccessMessage: {
    id: 'app.containers.Admin.User.saveSuccessMessage',
    defaultMessage: 'Invitation successfully sent out.',
  },
  inviteStatus: {
    id: 'app.containers.Admin.User.inviteStatus',
    defaultMessage: 'Status',
  },
  invitedSince: {
    id: 'app.containers.Admin.User.invitedSince',
    defaultMessage: 'Invited',
  },
  deleteInvite: {
    id: 'app.containers.Admin.User.deleteInvite',
    defaultMessage: 'Delete',
  },
  exportInvites: {
    id: 'app.containers.Admin.User.exportInvites',
    defaultMessage: 'Export all invitations',
  },
  inviteStatusPending: {
    id: 'app.containers.Admin.User.inviteStatusPending',
    defaultMessage: 'Pending',
  },
  inviteStatusAccepted: {
    id: 'app.containers.Admin.User.inviteStatusAccepted',
    defaultMessage: 'Accepted',
  },
  confirmDelete: {
    id: 'app.containers.Admin.User.confirmDelete',
    defaultMessage: 'Yes, I\'m sure',
  },
  currentlyNoInvites: {
    id: 'app.containers.Admin.User.currentlyNoInvites',
    defaultMessage: 'There currently are no invites yet',
  },
  currentlyNoInvitesThatMatchSearch: {
    id: 'app.containers.Admin.User.currentlyNoInvitesThatMatchSearch',
    defaultMessage: 'There are no invites that match your search',
  },
  filetypeError: {
    id: 'app.containers.Admin.User.filetypeError',
    defaultMessage: 'Incorrect file type. Only XLSX files are supported.',
  },
  unknownError: {
    id: 'app.containers.Admin.User.unknownError',
    defaultMessage: 'Something went wrong. Please try again later.',
  },
  allUsers: {
    id: 'app.containers.Admin.User.GroupsPanel.allUsers',
    defaultMessage: 'All users',
  },
  groupsTitle: {
    id: 'app.containers.Admin.User.GroupsPanel.groupsTitle',
    defaultMessage: 'Groups',
  },
  emptyGroup: {
    id: 'app.containers.AdminPage.Users.GroupsPanel.emptyGroup',
    defaultMessage: 'There is no users in this group yet',
  },
  goToAllUsers: {
    id: 'app.containers.AdminPage.Users.GroupsPanel.goToAllUsers',
    defaultMessage: 'Go on the {allUsersLink} tab to move users manually.',
  },
  step1TypeNameNormal: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1TypeNameNormal',
    defaultMessage: 'Normal group',
  },
  step1TypeNameSmart: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1TypeNameSmart',
    defaultMessage: 'Smart group',
  },
  step1TypeDescriptionNormal: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1TypeDescriptionNormal',
    defaultMessage: 'You have to add users manually to the group.',
  },
  step1TypeDescriptionSmart: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1TypeDescriptionSmart',
    defaultMessage: 'A smart group add continually and automatically users based on specific conditions you setup.',
  },
  step1CreateButtonNormal: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1CreateButtonNormal',
    defaultMessage: 'Create a normal group',
  },
  step1CreateButtonSmart: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1CreateButtonSmart',
    defaultMessage: 'Create a smart group',
  },
  step1ReadMore: {
    id: 'app.containers.AdminPage.Users.GroupCreation.step1ReadMore',
    defaultMessage: 'Read More about it',
  },
  modalHeaderStep1: {
    id: 'app.containers.AdminPage.Users.GroupCreation.modalHeaderStep1',
    defaultMessage: 'Select the type of group',
  },
  modalHeaderManual: {
    id: 'app.containers.AdminPage.Users.GroupCreation.modalHeaderManual',
    defaultMessage: 'Define a group name',
  },
  modalHeaderRules: {
    id: 'app.containers.AdminPage.Users.GroupCreation.modalHeaderRules',
    defaultMessage: 'Define your smart group settings',
  },
  fieldGroupName: {
    id: 'app.containers.AdminPage.Users.GroupCreation.fieldGroupName',
    defaultMessage: 'Name of the group',
  },
  groupFormTitle: {
    id: 'app.containers.AdminPage.Users.GroupCreation.groupFormTitle',
    defaultMessage: 'Define a group name',
  },
  selectAll: {
    id: 'app.containers.AdminPage.Users.GroupsPanel.selectAll',
    defaultMessage: 'Select all',
  },
  xUsers: {
    id: 'app.containers.AdminPage.Users.GroupsPanel.xUsers',
    defaultMessage: 'x Users',
  },
  groupDeletionConfirmation: {
    id: 'app.containers.AdminPage.Users.UsersGroup.groupDeletionConfirmation',
    defaultMessage: 'Are you sure?',
  },
});
