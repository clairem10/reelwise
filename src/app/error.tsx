'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="setup"><h1>A little hiccup.</h1><p>We couldn’t load this page. Your account data hasn’t been reset.</p><button className="pill" onClick={reset}>Try again →</button></main>}
