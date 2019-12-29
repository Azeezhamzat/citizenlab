import React, { memo, useCallback, MouseEvent } from 'react';

// components
import Icon, { IconNames } from 'components/UI/Icon';

// styling
import styled from 'styled-components';
import { colors, fontSizes } from 'utils/styleUtils';

const Container = styled.div`
  display: flex;
  align-items: center;
`;

const TabText = styled.span`
  color: ${colors.adminTextColor};
  font-size: ${fontSizes.base}px;
  font-weight: 400;
  white-space: nowrap;
`;

const TabIcon = styled(Icon)`
  fill: ${colors.adminTextColor};
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  margin-left: 10px;
`;

const Tab = styled.button<{ index: number }>`
  display: flex;
  align-items: center;
  margin: 0;
  margin-left: -1;
  padding: 11px 18px;
  background: #fff;
  border-radius: 0;
  border: solid 1px #ccc;
  z-index: ${({ index }) => index};
  cursor: pointer;
  transition: all 80ms ease-out;

  &.first {
    border-top-left-radius: ${({ theme }) => theme.borderRadius};
    border-bottom-left-radius: ${({ theme }) => theme.borderRadius};
  }

  &.last {
    border-top-right-radius: ${({ theme }) => theme.borderRadius};
    border-bottom-right-radius: ${({ theme }) => theme.borderRadius};
  }

  &:not(.selected):hover,
  &:not(.selected):focus {
    z-index: 10;
    border-color: ${colors.adminTextColor};
  }

  &.selected {
    border-color: ${colors.adminTextColor};
    background: ${colors.adminTextColor};

    ${TabText} {
      color: #fff;
    }

    ${TabIcon} {
      fill: #fff;
    }
  }
`;

export interface ITabItem {
  value: string;
  label: string | JSX.Element;
  icon?: IconNames;
}

interface Props {
  items: ITabItem[];
  selectedValue: string;
  selectedTabBgColor?: string;
  className?: string;
  onClick: (itemName: string) => void;
}

const Tabs = memo<Props>(({ items, selectedValue, onClick, className }) => {

  const removeFocus = useCallback((event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
  }, []);

  const handleTabOnClick = useCallback((event: MouseEvent<HTMLElement>) => {
    const newSelectedValue = event.currentTarget.dataset.itemvalue as string;
    onClick(newSelectedValue);
  }, []);

  return (
    <Container
      className={className}
      role="tablist"
    >
      {items.map((item: ITabItem, index) =>
        <Tab
          id={item.value}
          index={index + 1}
          role="tab"
          aria-selected={selectedValue === item.value}
          aria-controls={item.value}
          key={item.value}
          className={`${selectedValue === item.value ? 'selected' : ''} ${index === 0 ? 'first' : ''} ${index + 1 === items.length ? 'last' : ''}`}
          onMouseDown={removeFocus}
          onClick={handleTabOnClick}
          data-itemvalue={item.value}
        >
          <TabText>{item.label}</TabText>
          {item.icon && <TabIcon name={item.icon} />}
        </Tab>
      )}
    </Container>
  );
});

export default Tabs;
