import { formatCount } from "@/lib/analytics/format";
import { DataFreshness } from "./data-freshness";

type Props = {
  title: string;
  description: string;
  snapshot?: { fetchedAt: string; fetchedLabel: string };
  tableTotal?: number;
  matching?: number;
};

export function PageHeader({ title, description, snapshot, tableTotal, matching }: Props) {
  return (
    <header className="flex flex-col gap-3 border-b border-gf-border pb-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-gf-text">{title}</h1>
        <p className="max-w-3xl text-sm text-gf-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-2 xl:items-end">
        {tableTotal !== undefined && (
          <dl className="flex gap-4 text-xs text-gf-muted">
            <div className="flex gap-1.5">
              <dt>Students in table</dt>
              <dd className="font-mono font-semibold text-gf-text">{formatCount(tableTotal)}</dd>
            </div>
            {matching !== undefined && (
              <div className="flex gap-1.5">
                <dt>Matching filters</dt>
                <dd className="font-mono font-semibold text-gf-text">{formatCount(matching)}</dd>
              </div>
            )}
          </dl>
        )}
        {snapshot && <DataFreshness fetchedAt={snapshot.fetchedAt} fetchedLabel={snapshot.fetchedLabel} />}
      </div>
    </header>
  );
}
