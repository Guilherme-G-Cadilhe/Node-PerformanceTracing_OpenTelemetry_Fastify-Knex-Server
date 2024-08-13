// Conexão e configuração inicial do banco de dados utilizando Knex.js
import knex from 'knex';

export async function connect() {
    const db = knex({
        client: 'pg',
        // Define o cliente do Knex como PostgreSQL.
        connection: 'postgres://bobUser:teste@localhost:5432/testDB',
        searchPath: ['knex', 'public'],
        // Define os schemas de busca no PostgreSQL.
    });

    await db.raw('SELECT 1 as result');
    // Executa uma query simples para validar a conexão.
    return db;
}

export async function seedDb(db) {
    // Reinicia as tabelas 'students' e 'courses', se existirem
    await db.schema.dropTableIfExists('students');
    await db.schema.dropTableIfExists('courses');

    // Cria a tabela 'courses' com colunas 'id' e 'name'
    await db.schema.createTable('courses', function (table) {
        table.increments('id').primary();
        // ID auto-incremental como chave primária.
        table.string('name');
        // Nome do curso.
    });

    // Cria a tabela 'students' com colunas 'id', 'name' e 'courseId'
    await db.schema.createTable('students', (table) => {
        table.increments('id').primary();
        // ID auto-incremental como chave primária.
        table.string('name');
        // Nome do estudante.
        table.integer('courseId');
        // Chave estrangeira referenciando a tabela 'courses'.

        table
            .foreign('courseId')
            .references('courses.id')
            .withKeyName('fk_fkey_courses');
        // Cria a relação de chave estrangeira com a tabela 'courses'.
    });

    // Insere dados de exemplo na tabela 'courses'
    await db('courses')
        .insert([
            { name: 'Violão Avançado' },
            { name: 'NodeJS Avançado' }
        ]);

    // Insere dados de exemplo na tabela 'students'
    await db('students')
        .insert([
            { name: 'Guilherme', courseId: 1 },
        ]);

    // Executa queries para obter os dados inseridos e imprime no console
    const [courses, students] = await Promise.all([
        db('courses').select('*'),
        db('students').select('*'),
    ]);

    console.log({ courses, students });
}
