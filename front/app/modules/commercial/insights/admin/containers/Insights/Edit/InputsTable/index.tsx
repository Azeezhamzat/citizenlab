import React from 'react';
import { withRouter, WithRouterProps } from 'react-router';

// utils
import { isNilOrError } from 'utils/helperUtils';

// hooks
import useInsightsInputs from 'modules/commercial/insights/hooks/useInsightsInputs';

// components
import { Table, Checkbox } from 'cl2-component-library';
import InputsTableRow from './InputsTableRow';
import EmptyState from './EmptyState';

// styles
import styled from 'styled-components';
import { colors, fontSizes } from 'utils/styleUtils';

// intl
import { injectIntl } from 'utils/cl-intl';
import { InjectedIntlProps } from 'react-intl';
import messages from '../../messages';

const StyledTable = styled(Table)`
  background-color: #fff;
  thead {
    tr {
      th {
        padding: 12px;
        font-weight: bold;
      }
    }
  }
  tbody {
    tr {
      cursor: pointer;

      td {
        padding: 12px;
        color: ${colors.label};
        font-size: ${fontSizes.small}px;
      }
    }
    tr:hover {
      background-color: ${colors.background};
    }
  }
`;

const InputsTable = ({
  params: { viewId },
  intl: { formatMessage },
}: WithRouterProps & InjectedIntlProps) => {
  const inputs = useInsightsInputs(viewId);
  if (isNilOrError(inputs)) {
    return null;
  }
  return (
    <div data-testid="insightsInputsTable">
      {inputs.length === 0 ? (
        <EmptyState />
      ) : (
        <StyledTable>
          <colgroup>
            <col span={1} style={{ width: '5%' }} />
            <col span={1} style={{ width: '35%' }} />
            <col span={1} style={{ width: '60%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <Checkbox checked={false} onChange={() => {}} />
              </th>
              <th>{formatMessage(messages.inputsTableInputs)}</th>
              <th>{formatMessage(messages.inputsTableCategories)}</th>
            </tr>
          </thead>
          <tbody>
            {inputs.map((input) => (
              <InputsTableRow input={input} key={input.id} />
            ))}
          </tbody>
        </StyledTable>
      )}
    </div>
  );
};

export default injectIntl<{}>(withRouter(InputsTable));
