import { LogPanel } from '~/components/UI/LogPanel';
import { UiSelect } from '~/components/UI/UiSelect';

import { MemeCoinTokenItem } from './MemeCoinTokenItem';
import type { MemeCoinSortDirection, MemeCoinToken } from './types';

type SelectOption = {
  value: string;
  label: string;
};

type MemeCoinTokenBoardProps = {
  title: string;
  tokens: MemeCoinToken[];
  sortKey: string;
  sortDirection: MemeCoinSortDirection;
  sortKeyOptions: SelectOption[];
  sortDirectionOptions: SelectOption[];
  onSortKeyChange: (value: string) => void;
  onSortDirectionChange: (value: MemeCoinSortDirection) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  now: number;
  subTag?: string;
  onOpenChart?: (token: MemeCoinToken) => void;
};

export const MemeCoinTokenBoard = ({
  title,
  tokens,
  sortKey,
  sortDirection,
  sortKeyOptions,
  sortDirectionOptions,
  onSortKeyChange,
  onSortDirectionChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  now,
  subTag,
  onOpenChart,
}: MemeCoinTokenBoardProps) => {
  return (
    <LogPanel title={title} tags={[{ label: `${tokens.length} tokens` }, ...(subTag ? [{ label: subTag, dim: true }] : [])]} className="mcf-board">
      <div className="mcf-board-body">
        <div className="mcf-board-toolbar">
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="mcf-search-input"
            placeholder={searchPlaceholder ?? 'Search...'}
            aria-label={`${title} search`}
          />
          <UiSelect
            size="xs"
            value={sortKey}
            options={sortKeyOptions}
            onChange={onSortKeyChange}
            ariaLabel={`${title} sort key`}
            className="mcf-filter-key"
          />
          <UiSelect
            size="xs"
            value={sortDirection}
            options={sortDirectionOptions}
            onChange={(value) => onSortDirectionChange(value as MemeCoinSortDirection)}
            ariaLabel={`${title} sort direction`}
            className="mcf-filter-order"
          />
        </div>

        <div className="mcf-board-list">
          {tokens.length === 0 ? (
            <p className="mcf-empty">No token matches this filter.</p>
          ) : (
            tokens.map((token) => <MemeCoinTokenItem key={token.id} token={token} now={now} onOpenChart={onOpenChart} />)
          )}
        </div>
      </div>
    </LogPanel>
  );
};
