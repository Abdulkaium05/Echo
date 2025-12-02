
// src/app/page.tsx

// This page should ideally not be reached if the redirect in next.config.ts is working.
// It serves as a fallback or a minimal component for the root path.
export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2em', marginBottom: '0.5em' }}>Loading...</h1>
      <p style={{ fontSize: '1em', color: '#555' }}>If you are not redirected automatically, please <a href="/login" style={{ color: '#0070f3', textDecoration: 'none' }}>click here to login</a>.</p>
    </div>
  );
}
