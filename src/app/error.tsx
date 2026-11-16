'use client';

import posthog from 'posthog-js';
import {useEffect} from 'react';

export default function ErrorPage({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
  useEffect(()=>{posthog.captureException(error);},[error]);

  return <main className="setup"><h1>A little hiccup.</h1><p>We couldn’t load this page. Your account data hasn’t been reset.</p><button className="pill" onClick={reset}>Try again →</button></main>;
}
