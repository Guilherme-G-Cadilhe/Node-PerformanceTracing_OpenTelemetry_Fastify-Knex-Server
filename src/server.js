
// Inicializa o Tracing e Modifica as bibliotecas para incluir o rastreamento
import { initializeTracing } from './tracing.js'
await initializeTracing();

// Adiciona rastreamento customizado para ser enviado ao Collector
import { trace, context } from '@opentelemetry/api'

// Importação e configuração inicial do servidor Fastify já modificado
import Fastify from 'fastify';
import { connect, seedDb } from './db.js'
const PORT = 8080;

const app = Fastify({ logger: true });
// Habilita logs detalhados para cada requisição, útil para monitoramento.

// Conexão ao banco de dados e preparação da base de dados
const _db = await connect();
await seedDb(_db);
// Função para popular o banco de dados com dados iniciais.

// Variável de controle para simular diferentes tipos de respostas
let counter = 0;

app.get('/students', async (request, reply) => {
    const span = trace.getSpan(context.active());
    span.setAttribute('app.counter', counter); // Campo customizado no Jaeger com o dado de contagem

    ++counter;

    // Simulação de três tipos de respostas para análise de performance
    if (counter === 1) {
        // Pior performance: busca detalhada com múltiplas queries
        const students = await _db('students').select('*');
        for (const student of students) {
            const course = await _db('courses').select('*').where({ id: student.courseId }).first();
            student.course = course.name;
            delete student.courseId;
        }

        const payload = {
            students,
            message: "this is from the really bad response"
        };

        span.setAttribute('http.response_payload', JSON.stringify(payload));
        // Campo customizado no Jaeger com o dado de resposta (Não recomendado, por segurança)

        return reply.status(202).send(payload);
    }

    if (counter === 2) {
        // Melhor performance: busca otimizada com join direto
        const students = await _db('students')
            .select('students.id', 'students.name', 'courses.name as course')
            .innerJoin('courses', 'courses.id', 'students.courseId');

        const payload = {
            students,
            message: 'this is the best response'
        };
        span.setAttribute('http.response_payload', JSON.stringify(payload));
        // Campo customizado no Jaeger com o dado de resposta (Não recomendado, por segurança)

        return reply.send(payload);
    }

    // Resposta de erro para testar handling de diferentes status codes
    counter = 0;
    return reply.status(401).send({ message: 'just responding with a different code!' });
});

// Inicialização do servidor e escuta na porta configurada
const address = await app.listen({ port: PORT });
console.log(`Server is running on ${address}`);
