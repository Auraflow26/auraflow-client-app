import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-mono text-6xl font-semibold text-accent">404</div>
      <h1 className="mt-2 text-xl font-semibold text-text-primary">Not found</h1>
      <p className="mt-1 text-sm text-text-muted">That page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-6 rounded-input bg-accent px-5 py-2.5 text-sm font-medium text-white"
      >
        Back home
      </Link>
    </main>
  )
}
