import Topbar from '../components/Topbar';

export default function ComingSoon({ title, note }) {
  return (
    <div className="page">
      <Topbar title={title} subtitle="This page hasn't been built yet" />
      <div className="page-content">
        <div className="table-wrap" style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
          <i className="ti ti-tools" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
          {title} is coming soon.
          {note && <p style={{ fontSize: 12.5, marginTop: 8, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{note}</p>}
        </div>
      </div>
    </div>
  );
}
