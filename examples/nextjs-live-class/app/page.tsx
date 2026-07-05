export default function HomePage() {
  return (
    <main style={{ padding: 32, maxWidth: 640, lineHeight: 1.6 }}>
      <h1 style={{ marginTop: 0 }}>StreamFlow — Next.js example</h1>
      <p>
        Full-stack live room with three keys and zero manual URL config. Server routes
        come from <code>@streamflow/node/next</code>; the UI uses{" "}
        <code>@streamflow/react</code>.
      </p>
      <ol>
        <li>
          Copy <code>.env.example</code> → <code>.env.local</code> and add your keys
        </li>
        <li>
          Run <code>npm run create-room</code>
        </li>
        <li>Open the printed room URL</li>
      </ol>
    </main>
  )
}
