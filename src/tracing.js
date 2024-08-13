// Importação dos módulos principais do OpenTelemetry

import {
  diag, // Módulo para configuração de diagnósticos e logs
  DiagConsoleLogger, // Logger que envia logs de diagnóstico para o console
  DiagLogLevel // Nível de log utilizado para controlar a verbosidade dos logs de diagnóstico
} from '@opentelemetry/api';

import { NodeSDK } from '@opentelemetry/sdk-node';
// SDK principal para configurar o rastreamento (tracing) em aplicações Node.js

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
// Exportador de traces utilizando o protocolo gRPC, que envia os dados de rastreamento para um endpoint definido

// Importação das instrumentações para monitorar automaticamente as requisições HTTP e as queries Knex
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex';

// Configuração do logger para capturar apenas logs de nível de erro e acima
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

// Criação de uma instância do NodeSDK com a configuração necessária para o rastreamento (tracing)
const sdk = new NodeSDK({
  serviceName: 'students-api',
  // Nome do serviço que será incluído nos traces, útil para identificar a origem dos dados em sistemas distribuídos

  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4317',
    // URL com a porta do exportador OTLP gRPC, apontando para o Collector configurado no otel-collector-config.yml
    compression: 'gzip',
    // Compressão dos dados enviados ao Collector, recomendada para melhorar o desempenho
  }),

  instrumentations: [
    new HttpInstrumentation(),
    // Instrumentação automática para monitorar todas as requisições HTTP feitas pela aplicação
    new KnexInstrumentation()
    // Instrumentação automática para monitorar todas as queries feitas pelo Knex.js (ORM)
  ],
});

process.on('beforeExit', async () => {
  await sdk.shutdown();
  // Shutdown do SDK, garantindo que todos os traces pendentes sejam enviados antes de encerrar o processo Node.js
});

export const initializeTracing = async () => {
  return sdk.start();
  // Inicia o SDK e começa a capturar e enviar traces para o Collector
}
