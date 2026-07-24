type DeferredFeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  emptyMessage: string;
};

export function DeferredFeaturePage({
  eyebrow,
  title,
  description,
  emptyMessage,
}: DeferredFeaturePageProps) {
  return (
    <section className="workspace-section deferred-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="section-intro">{description}</p>
      <div className="deferred-state">
        <h2>This area is ready for connection</h2>
        <p>{emptyMessage}</p>
        <p>
          Navigation and session protection are active. Connected data
          and actions will appear here when the feature is available.
        </p>
      </div>
    </section>
  );
}
