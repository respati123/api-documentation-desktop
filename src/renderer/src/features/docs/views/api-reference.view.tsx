import type { ReactElement } from 'react'
import type { useApiReferenceViewModel } from '@/features/docs/viewmodels/use-api-reference.viewmodel'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/utils/cn'

export type ApiReferenceViewProps = ReturnType<typeof useApiReferenceViewModel>

function CodeBlockView({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <div className="docs-code-block">
      <div>{label}</div>
      <pre>{value}</pre>
    </div>
  )
}

export function ApiReferenceView(props: ApiReferenceViewProps): ReactElement {
  const { payload, tables, responses } = props
  return (
    <section className="request-card docs-page" aria-label={props.ariaLabel}>
      <header className="docs-page-heading">
        <div>
          <p className="section-kicker">{props.kicker}</p>
          <h2>{props.name}</h2>
        </div>
        <div className="docs-page-actions">
          <Button type="button" variant="outline" size="sm" onClick={props.onOpenOpenApi}>
            {props.openApiLabel}
          </Button>
          <Button type="button" size="sm" onClick={props.onOpenRequest}>
            {props.openRequestLabel}
          </Button>
        </div>
      </header>
      <div className="docs-page-content">
        <div className="docs-route-line">
          <span className={`docs-method method-${props.method.toLowerCase()}`}>{props.method}</span>
          <code>{props.routeText}</code>
          {props.deprecated && <span className="docs-deprecated">{props.deprecatedLabel}</span>}
        </div>
        {props.deprecationReason && <p className="docs-deprecation-reason">{props.deprecationReason}</p>}
        {props.overview && (
          <section className="docs-section">
            <h2>{props.overviewLabel}</h2>
            <p className="docs-description">{props.overview}</p>
          </section>
        )}
        <section className="docs-section">
          <h2>{props.requestLabel}</h2>
          <div className="docs-request-facts">
            <div>
              <span>{props.authenticationLabel}</span>
              <strong>{props.authDescription}</strong>
            </div>
            <div>
              <span>{props.bodyTypeLabel}</span>
              <strong>{props.bodyTypeName}</strong>
            </div>
          </div>
          {tables.map((table) => (
            <div className="docs-subsection" key={table.title}>
              <h3>{table.title}</h3>
              <div className="docs-table">
                <div className="docs-table-heading">
                  {props.tableHeadings.map((heading) => (
                    <span key={heading}>{heading}</span>
                  ))}
                </div>
                {table.rows.map((row) => (
                  <div className="docs-table-row" key={row.id}>
                    <code>{row.name}</code>
                    <span>{row.example}</span>
                    <span>{row.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="docs-subsection">
            <h3>{props.bodyLabel}</h3>
            {payload.kind === 'text' && <p className="docs-muted">{payload.text}</p>}
            {payload.kind === 'fields' && (
              <div className="docs-key-values">
                {payload.rows.map((row) => (
                  <div className="docs-key-value" key={row.id}>
                    <strong>{row.name}</strong>
                    <code>{row.value}</code>
                  </div>
                ))}
              </div>
            )}
            {payload.kind === 'blocks' && (
              <div className="docs-code-stack">
                {payload.blocks.map((block) => (
                  <CodeBlockView key={block.label} label={block.label} value={block.value} />
                ))}
              </div>
            )}
          </div>
        </section>
        <section className="docs-section">
          <div className="docs-section-heading">
            <h2>{props.responsesLabel}</h2>
            <span>{props.responseCount}</span>
          </div>
          {props.noResponse && (
            <div className="docs-empty">
              <strong>{props.noResponse.title}</strong>
              <span>{props.noResponse.description}</span>
            </div>
          )}
          {responses.map((response) => (
            <article className="docs-response" key={response.id}>
              <header>
                <strong className={cn(response.isError ? 'docs-status-error' : 'docs-status-success')}>{response.statusCode}</strong>
                <span>{response.description}</span>
              </header>
              {response.contents.map((content) => (
                <div className="docs-response-content" key={content.id}>
                  <p className="docs-content-type">{content.mediaType}</p>
                  {content.blocks.map((block) => (
                    <CodeBlockView key={block.label} label={block.label} value={block.value} />
                  ))}
                  {content.emptyText && <p className="docs-muted">{content.emptyText}</p>}
                </div>
              ))}
              {response.emptyText && <p className="docs-muted docs-response-empty">{response.emptyText}</p>}
            </article>
          ))}
        </section>
      </div>
    </section>
  )
}
