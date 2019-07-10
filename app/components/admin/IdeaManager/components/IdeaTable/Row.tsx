import React from 'react';

// services
import { IIdeaData } from 'services/ideas';
import { IPhaseData } from 'services/phases';
import { IIdeaStatusData } from 'services/ideaStatuses';

// style
import styled from 'styled-components';

import IdeaRow from './IdeaRow';
import { ManagerType, TFilterMenu } from '../..';

export const StyledRow = styled.tr`
  height: 5.7rem !important;
  cursor: move;
`;

export const FilterCell = styled.td`
  border-top: none !important;
`;

export const TitleLink = styled.a`
  display: block;
  display: -webkit-box;
  margin: 0 auto;
  &:not(:last-child) {
    margin-bottom: 7px;
  }
  font-size: $font-size;
  line-height: $line-height;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  color: black;
  &:hover, &:focus {
    text-decoration: underline;
  }
`;

type Props = {
  type: ManagerType;
  post: IIdeaData,
  phases?: IPhaseData[],
  statuses?: IIdeaStatusData[],
  selection: Set<string>,
  onUnselect: () => void,
  onToggleSelect: () => void,
  onSingleSelect: () => void;
  activeFilterMenu: TFilterMenu;
  openPreview: (ideaId: string) => void;
  className?: string;
};

export default class Row extends React.PureComponent<Props> {
  onClickRow = (event) => {
    const {
      onToggleSelect,
      onSingleSelect
    } = this.props;

    if (event.ctrlKey) {
      onToggleSelect();
    } else {
      onSingleSelect();
    }
  }

  // TODO TOPICS removal fix

  onClickCheckbox = (event) => {
    event.stopPropagation();
    this.props.onToggleSelect();
  }

  onClickTitle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const { post, openPreview } = this.props;
    openPreview(post.id);
  }

  nothingHappens = (event) => {
    event.preventDefault();
    event.stopPropagation();
  }

  render() {
    const { type, post, selection, activeFilterMenu, phases, statuses, className } = this.props;
    if (type === 'AllIdeas' || type === 'ProjectIdeas') {
      return (
        <IdeaRow
          idea={post}
          phases={phases}
          statuses={statuses}
          selection={selection}
          activeFilterMenu={activeFilterMenu}
          className={className}
          onClickRow={this.onClickRow}
          onClickCheckbox={this.onClickCheckbox}
          onClickTitle={this.onClickTitle}
          nothingHappens={this.nothingHappens}
        />
      );
    }
    return null;
  }
}
