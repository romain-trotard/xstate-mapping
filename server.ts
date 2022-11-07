import Fastify from 'fastify';
import FastifyCors from '@fastify/cors';
import categories from './categories.js';
import articles from './articles.js';

const PAGE_LIMIT = 3;

function getPage({ values, pageNumber = 0 }: { pageNumber: number, values: unknown[] }) {
    const pageValues = values.slice(pageNumber * PAGE_LIMIT, (pageNumber + 1) * PAGE_LIMIT);
    const hasNextPage = Math.ceil(values.length / PAGE_LIMIT) - 1 > pageNumber;

    return {
        values: pageValues,
        nextPage: hasNextPage ? ++pageNumber : undefined,
    };
}

const server = Fastify();

server.register(FastifyCors);

server.get('/articles', (request, reply) => {
    const pageNumber = parseInt((request.query as { pageNumber: string }).pageNumber);

    reply.send(getPage({ values: articles, pageNumber }));
});

server.get('/categories', (request, reply) => {
    const pageNumber = parseInt((request.query as { pageNumber: string }).pageNumber);

    reply.send(getPage({ values: categories, pageNumber }));
});


(async function main() {
    await server.listen({ port: 3000 });

    console.log('Server started on 3000');
})()
