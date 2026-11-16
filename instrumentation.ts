import {SeverityNumber} from '@opentelemetry/api-logs';
import {OTLPLogExporter} from '@opentelemetry/exporter-logs-otlp-http';
import {resourceFromAttributes} from '@opentelemetry/resources';
import {BatchLogRecordProcessor,LoggerProvider} from '@opentelemetry/sdk-logs';

const token=process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host=process.env.NEXT_PUBLIC_POSTHOG_HOST;
const missingConfig=!token?'NEXT_PUBLIC_POSTHOG_KEY':!host?'NEXT_PUBLIC_POSTHOG_HOST':null;

if(missingConfig&&process.env.NODE_ENV!=='production'){
 console.warn(`${missingConfig} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingConfig} is configured`);
}

let loggerProvider:LoggerProvider|undefined;
let posthogLogger:ReturnType<LoggerProvider['getLogger']>|undefined;

if(!missingConfig){
 try{
  loggerProvider=new LoggerProvider({resource:resourceFromAttributes({'service.name':'reelwise'}),processors:[new BatchLogRecordProcessor({exporter:new OTLPLogExporter({url:new URL('/i/v1/logs',host).toString(),headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}})})]});
  posthogLogger=loggerProvider.getLogger('reelwise-posthog-logs');
 }catch{
  if(process.env.NODE_ENV!=='production')console.warn('PostHog log exporter could not be configured.');
 }
}

export {loggerProvider,posthogLogger};

export function register(){
 if(process.env.NEXT_RUNTIME==='nodejs')posthogLogger?.emit({body:'posthog_log_exporter_initialized',severityNumber:SeverityNumber.INFO,attributes:{runtime:'nextjs'}});
}
